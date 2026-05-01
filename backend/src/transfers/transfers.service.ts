import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    // data: { fromWarehouseId, toWarehouseId, items: [{productId, quantity}] }
    
    return this.prisma.$transaction(async (tx) => {
        // Validate stock
        for (const item of data.items) {
           const ws = await tx.warehouseStock.findUnique({
               where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: item.productId } }
           });
           if (!ws || ws.stock < item.quantity) {
               const p = await tx.product.findUnique({where: {id: item.productId}});
               throw new BadRequestException(`Sin stock suficiente en la sucursal de origen para: ${p?.name}`);
           }
        }

        // Deduct from Origin
        for (const item of data.items) {
           await tx.warehouseStock.update({
               where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: item.productId } },
               data: { stock: { decrement: item.quantity } }
           });
           
           // Movimiento "Salida por Traspaso"
           await tx.inventoryMovement.create({
               data: {
                   tenantId,
                   productId: item.productId,
                   type: 'OUT',
                   quantity: item.quantity,
                   reference: `Salida a Tránsito -> Bodega Destino`
               }
           });
        }

        // Create ORDER
        return tx.transferOrder.create({
            data: {
                tenantId,
                fromWarehouseId: data.fromWarehouseId,
                toWarehouseId: data.toWarehouseId,
                status: 'IN_TRANSIT',
                reference: data.reference,
                items: {
                    create: data.items.map((i: any) => ({
                        productId: i.productId,
                        quantity: i.quantity
                    }))
                }
            }
        });
    });
  }

  findAll(tenantId: string) {
    return this.prisma.transferOrder.findMany({
      where: { tenantId },
      include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { product: true } }
      },
      orderBy: { issueDate: 'desc' }
    });
  }

  async receive(tenantId: string, id: string, itemsRecv: any[]) {
      // itemsRecv: [{ itemId (transferItem.id), receivedQty }]
      return this.prisma.$transaction(async (tx) => {
          const order = await tx.transferOrder.findUnique({ where: { id, tenantId }, include: { items: true } });
          if (!order) throw new NotFoundException('Traspaso no encontrado');
          if (order.status !== 'IN_TRANSIT') throw new BadRequestException('El traspaso no está en ruta');

          let hasDiscrepancy = false;

          for (const recv of itemsRecv) {
              const orderItem = order.items.find(i => i.id === recv.itemId);
              if (!orderItem) continue;

              if (recv.receivedQty < orderItem.quantity) hasDiscrepancy = true;
              else if (recv.receivedQty > orderItem.quantity) throw new BadRequestException('No puedes recibir más de lo enviado');

              await tx.transferItem.update({
                  where: { id: orderItem.id },
                  data: { receivedQty: recv.receivedQty }
              });

              if (recv.receivedQty > 0) {
                 // Add to destination
                 await tx.warehouseStock.upsert({
                     where: { warehouseId_productId: { warehouseId: order.toWarehouseId, productId: orderItem.productId } },
                     create: { warehouseId: order.toWarehouseId, productId: orderItem.productId, stock: recv.receivedQty },
                     update: { stock: { increment: recv.receivedQty } }
                 });

                 // Movimiento "Entrada por Traspaso"
                 await tx.inventoryMovement.create({
                     data: {
                         tenantId,
                         productId: orderItem.productId,
                         type: 'IN',
                         quantity: recv.receivedQty,
                         reference: `Entrada Traspaso Confirmada`
                     }
                 });
              }
          }

          // Update Status
          const finalStatus = hasDiscrepancy ? 'DISCREPANCY' : 'RECEIVED';
          return tx.transferOrder.update({
              where: { id },
              data: {
                  status: finalStatus,
                  receivedDate: new Date()
              }
          });
      });
  }

  async resolveDiscrepancy(tenantId: string, id: string, action: 'MERMA' | 'RETURN_TO_ORIGIN') {
      return this.prisma.$transaction(async (tx) => {
          const order = await tx.transferOrder.findUnique({ where: { id, tenantId }, include: { items: true } });
          if (!order || order.status !== 'DISCREPANCY') throw new BadRequestException('No aplica resolución');

          for (const item of order.items) {
              const diff = item.quantity - item.receivedQty;
              if (diff > 0) {
                  if (action === 'MERMA') {
                      // Adjust global Product stock because it was LOST
                      await tx.product.update({
                          where: { id: item.productId },
                          data: { stock: { decrement: diff } }
                      });
                      
                      await tx.inventoryMovement.create({
                         data: {
                             tenantId,
                             productId: item.productId,
                             type: 'OUT',
                             quantity: diff,
                             reference: `Merma Autorizada de Traspaso ${order.id}`
                         }
                      });
                  } else {
                      // Return to Origin Warehouse
                      await tx.warehouseStock.update({
                          where: { warehouseId_productId: { warehouseId: order.fromWarehouseId, productId: item.productId } },
                          data: { stock: { increment: diff } }
                      });
                  }
              }
          }

          return tx.transferOrder.update({
              where: { id },
              data: { status: 'RECEIVED' }
          });
      });
  }
}
