import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService
  ) {}

  async checkout(tenantId: string, payload: any) {
     // Validate tenant access
     const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
     if (!tenant || !tenant.hasPosAccess) {
         throw new BadRequestException('Esta empresa no tiene el módulo de Punto de Venta activo. Haz Upgrade a tu plan.');
     }

     const { items, paymentMethod, paymentForm, ticketNotes, cashShiftId, customFields } = payload;
     if (!items || items.length === 0) throw new BadRequestException('El carrito está vacío');

     // 1. Process Stock (Direct and Kits) & Log Movements
     for (const item of items) {
       const product = await this.prisma.product.findUnique({ 
          where: { id: item.productId },
          include: { kitComponents: true }
       });
       if (!product) throw new BadRequestException(`Producto no encontrado`);
       
       if (product.type === 'KIT' || product.type === 'SERVICE') {
          for (const comp of product.kitComponents) {
             const child = await this.prisma.product.findUnique({ where: { id: comp.childProductId }});
             if (child && child.trackInventory) {
                const qtyNeeded = comp.quantity * item.quantity;
                if (child.stock < qtyNeeded) {
                   throw new BadRequestException(`Falta inventario del componente ${child.name} para completar: ${product.name}.`);
                }
                await this.prisma.product.update({
                   where: { id: child.id },
                   data: { stock: { decrement: qtyNeeded } }
                });
                // @ts-ignore
                await this.prisma.inventoryMovement.create({
                   data: {
                      tenantId,
                      productId: child.id,
                      type: 'SALE',
                      quantity: -qtyNeeded,
                      reference: `Venta Mostrador: ${product.name}`,
                   }
                });
             }
          }
       } else if (product.trackInventory) {
         if (product.stock < item.quantity) {
           throw new BadRequestException(`Inventario insuficiente para ${product.name}. Quedan ${product.stock}`);
         }
         
         if (product.hasSerials) {
            if (!item.serials || item.serials.length !== item.quantity) {
                throw new BadRequestException(`Debe proporcionar ${item.quantity} números de serie para ${product.name}`);
            }
            for (const serial of item.serials) {
                const serialDb = await (this.prisma as any).serialNumber.findUnique({
                    where: { productId_serial: { productId: product.id, serial } }
                });
                if (!serialDb || serialDb.status !== 'AVAILABLE') {
                    throw new BadRequestException(`La serie ${serial} de ${product.name} no está disponible.`);
                }
                await (this.prisma as any).serialNumber.update({
                    where: { id: serialDb.id },
                    data: { status: 'SOLD', soldAt: new Date() }
                });
            }
         }

         await this.prisma.product.update({
           where: { id: item.productId },
           data: { stock: { decrement: item.quantity } }
         });
         // @ts-ignore
         await this.prisma.inventoryMovement.create({
            data: {
               tenantId,
               productId: item.productId,
               type: 'SALE',
               quantity: -item.quantity,
               reference: `Venta Mostrador Directa`,
            }
         });
       }
     }

     // 2. Obtener o crear Cliente Público en General
     let publicoGen = await this.prisma.customer.findFirst({
         where: { tenantId, rfc: 'XAXX010101000' }
     });
     if (!publicoGen) {
         publicoGen = await this.prisma.customer.create({
             data: {
                 tenantId,
                 legalName: 'PÚBLICO EN GENERAL',
                 rfc: 'XAXX010101000',
                 taxRegime: '616'
             }
         });
     }

     // 3. Crear "Ticket" usando el sistema de Cotizaciones/Facturas en DRAFT
     return this.invoicesService.create({
         tenantId,
         customerId: publicoGen.id,
         paymentMethod: paymentMethod || 'PUE',
         paymentForm: paymentForm || '01',
         cfdiUse: 'S01',
         items: items.map((i: any) => ({
            productId: i.productId,
            description: i.description || i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
            taxRate: 0.16
         })),
         status: 'DRAFT', // Mantiene fuera del radar del SAT
         ...(cashShiftId && { cashShiftId }),
         ...(customFields && { customFields })
     } as any);
     
     // TODO: Emitir evento web-socket o notificación
  }

  // ------------ CASH SHIFT METHODS -------------

  async getCurrentShift(tenantId: string) {
      return this.prisma.cashShift.findFirst({
         where: { tenantId, status: 'OPEN' },
         include: { openedBy: { select: { id: true, name: true, email: true } } }
      });
  }

  async openShift(tenantId: string, payload: { startingCash: number, userId: string }) {
      const existing = await this.getCurrentShift(tenantId);
      if (existing) throw new BadRequestException('Ya existe un turno abierto. Ciérralo primero.');
      return this.prisma.cashShift.create({
          data: {
             tenantId,
             openedById: payload.userId,
             startingCash: payload.startingCash
          }
      });
  }

  async getShiftSummary(tenantId: string, shiftId: string) {
      const shift = await this.prisma.cashShift.findUnique({
          where: { id: shiftId, tenantId },
          include: { 
             invoices: true, 
             movements: true,
             openedBy: true
          }
      });
      if (!shift) throw new BadRequestException('Turno no encontrado');

      let cashSales = 0;
      let cardSales = 0;
      let transferSales = 0;
      
      for (const inv of shift.invoices) {
         if (inv.status !== 'CANCELADA') {
            if (inv.paymentForm === '01') cashSales += inv.total;
            else if (inv.paymentForm === '04' || inv.paymentForm === '28' || inv.paymentForm === '04') cardSales += inv.total;
            else if (inv.paymentForm === '03') transferSales += inv.total;
            else cashSales += inv.total;
         }
      }

      let cashIn = 0;
      let cashOut = 0;

      for (const mov of shift.movements) {
          if (mov.type === 'IN') cashIn += mov.amount;
          if (mov.type === 'OUT') cashOut += mov.amount;
      }

      const expectedCash = shift.startingCash + cashSales + cashIn - cashOut;

      return {
          id: shift.id,
          startingCash: shift.startingCash,
          status: shift.status,
          openedAt: shift.openedAt,
          openedByName: shift?.openedBy?.name,
          cashSales,
          cardSales,
          transferSales,
          totalSales: cashSales + cardSales + transferSales,
          cashIn,
          cashOut,
          expectedCash,
          movementsCount: shift.movements.length,
          salesCount: shift.invoices.length
      };
  }

  async closeShift(tenantId: string, shiftId: string, userId: string) {
      return this.prisma.cashShift.update({
          where: { id: shiftId },
          data: {
             status: 'CLOSED',
             closedAt: new Date(),
             closedById: userId
          }
      });
  }

  async addMovement(tenantId: string, shiftId: string, payload: { type: string, amount: number, reason: string }) {
      return this.prisma.cashMovement.create({
          data: {
             cashShiftId: shiftId,
             type: payload.type,
             amount: payload.amount,
             reason: payload.reason
          }
      });
  }

}
