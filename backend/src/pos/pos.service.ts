import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
       // --- FASE 4: SERVICIOS Y RECARGAS ---
       if (item.customFields?.type === 'TOPUP') {
          // MOCK: Llamada a proveedor de recargas (MTCenter / Taecel)
          console.log(`📡 [MOCK API] Disparando recarga de $${item.unitPrice} para ${item.customFields.provider} (Tel: ${item.customFields.phone})...`);
          // En un escenario real: await axios.post('https://api.mtcenter.com.mx/topup', { phone, amount, ... })
          // Si falla, lanzar error y abortar venta.
          continue; // No procesar inventario para recargas
       }

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
         
         if (product.hasBatches) {
             let remainingToDeduct = item.quantity;
             const batches = await (this.prisma as any).productBatch.findMany({
                 where: { productId: product.id, stock: { gt: 0 } },
                 orderBy: { expiryDate: 'asc' }
             });
             
             for (const batch of batches) {
                 if (remainingToDeduct <= 0) break;
                 const deductFromThisBatch = Math.min(batch.stock, remainingToDeduct);
                 await (this.prisma as any).productBatch.update({
                     where: { id: batch.id },
                     data: { stock: { decrement: deductFromThisBatch } }
                 });
                 remainingToDeduct -= deductFromThisBatch;
             }
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

     // 2. Resolve Customer (General Public or Specific for Fiado)
     let customerId: string;
     let finalStatus = 'DRAFT'; // Paid ticket (cash, card)
     
     if (paymentMethod === '99') { // 99 = Por Definir (FIADO)
         if (!payload.customerId) {
             throw new BadRequestException('Para cobrar a Fiado debe seleccionar un cliente.');
         }
         
         const customer = await this.prisma.customer.findUnique({ where: { id: payload.customerId } });
         if (!customer) throw new BadRequestException('Cliente no encontrado.');
         
         if (!customer.creditEnabled) {
             throw new BadRequestException('El cliente no tiene el crédito habilitado.');
         }
         if (customer.creditStatus !== 'ACTIVE') {
             throw new BadRequestException('El crédito del cliente está suspendido.');
         }
         
         // Calculate total purchase
         const purchaseTotal = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice * (1 - (i.discount || 0))), 0);
         // Add taxes (assuming 16% for simplicity in this POS view)
         const finalTotal = purchaseTotal * 1.16;
         
         // Check current debt
         const unpaidInvoices = await this.prisma.invoice.findMany({
             where: { customerId: customer.id, paymentMethod: '99', status: 'UNPAID' },
             include: { payments: true }
         });
         let currentDebt = 0;
         for (const inv of unpaidInvoices) {
             const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
             currentDebt += (inv.total - paid);
         }
         
         if (currentDebt + finalTotal > customer.creditLimit) {
             if (!payload.overridePin) {
                 throw new BadRequestException(`Límite de crédito excedido. Disponible: $${(customer.creditLimit - currentDebt).toFixed(2)}. Requiere PIN de Encargado para autorizar.`);
             }
             // Verify Manager PIN
             await this.authorizeAction(tenantId, payload.overridePin);
         }
         
         customerId = customer.id;
         finalStatus = 'UNPAID';
     } else {
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
         // If a specific customer is provided for a cash/card sale, use it. Otherwise, use public.
         customerId = payload.customerId || publicoGen.id;
     }

     // 3. Crear "Ticket" usando el sistema de Cotizaciones/Facturas en DRAFT o UNPAID
     const invoice = await this.invoicesService.create({
         tenantId,
         customerId,
         paymentMethod: paymentMethod || 'PUE',
         paymentForm: paymentForm || '01',
         cfdiUse: 'S01',
         items: items.map((i: any) => ({
            productId: i.productId.startsWith('virtual-') ? null : i.productId, // Manejar productos virtuales
            description: i.description || i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
            taxRate: i.taxRate !== undefined ? i.taxRate : 0.16
         })),
         status: finalStatus, // DRAFT (Paid) o UNPAID (Fiado)
         ...(cashShiftId && { cashShiftId }),
         ...(customFields && { customFields })
     } as any);

     // --- FASE 4: MERCADO PAGO POINT API ---
     if (paymentForm === '04' || paymentForm === '28') {
         // MOCK: Payment Intent hacia Terminal Smart Point
         console.log(`💳 [MOCK API] Enviando cobro de $${invoice.total} a Terminal Point Mercado Pago (Device ID: POS-1)...`);
         // En un escenario real: 
         // await axios.post('https://api.mercadopago.com/point/integration-api/devices/{DEVICE_ID}/payment-intents', { amount: invoice.total })
         // Aquí se implementaría un Webhook o Polling para esperar confirmación física.
     }
     
     return invoice;
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

  async authorizeAction(tenantId: string, pin: string) {
      if (!pin) throw new UnauthorizedException('Debe ingresar un PIN');
      const manager = await this.prisma.user.findFirst({
          where: { 
              tenantId, 
              posPin: pin,
              role: { in: ['OWNER', 'ADMIN'] } 
          }
      });
      if (!manager) {
          throw new UnauthorizedException('PIN incorrecto o usuario sin permisos');
      }
      return { authorized: true, managerName: manager.name };
  }

}
