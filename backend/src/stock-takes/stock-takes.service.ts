import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockTakesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    // data: warehouseId, auditorId, productIds (optional, if empty means all trackable products)
    
    // 1. Get products in warehouse
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        trackInventory: true,
        ...(data.productIds && data.productIds.length > 0 ? { id: { in: data.productIds } } : {})
      },
      include: {
        warehouseStocks: {
          where: { warehouseId: data.warehouseId }
        }
      }
    });

    if (products.length === 0) {
      throw new BadRequestException('No hay productos disponibles para auditar en esta selección.');
    }

    // 2. Create StockTake
    return this.prisma.stockTake.create({
      data: {
        tenantId,
        warehouseId: data.warehouseId,
        auditorId: data.auditorId,
        status: 'IN_PROGRESS',
        items: {
          create: products.map(p => {
            const ws = p.warehouseStocks[0];
            return {
              productId: p.id,
              expectedQty: ws ? ws.stock : 0
            };
          })
        }
      },
      include: {
        warehouse: true,
        auditor: true
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.stockTake.findMany({
      where: { tenantId },
      include: {
        warehouse: true,
        auditor: true,
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    const st = await this.prisma.stockTake.findFirst({
      where: { tenantId, id },
      include: {
        warehouse: true,
        auditor: true,
        items: {
          include: { product: true },
          orderBy: { product: { name: 'asc' } }
        }
      }
    });
    if (!st) throw new NotFoundException('StockTake not found');
    return st;
  }

  async submitCounts(tenantId: string, id: string, counts: { itemId: string, countedQty: number }[]) {
    const st = await this.findOne(tenantId, id);
    if (st.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Esta auditoría ya no está en progreso.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const c of counts) {
        const item = st.items.find(i => i.id === c.itemId);
        if (!item) continue;
        await tx.stockTakeItem.update({
          where: { id: item.id },
          data: {
            countedQty: c.countedQty,
            discrepancy: c.countedQty - item.expectedQty
          }
        });
      }

      await tx.stockTake.update({
        where: { id },
        data: { status: 'REVIEW' }
      });
    });

    return this.findOne(tenantId, id);
  }

  async applyAdjustments(tenantId: string, id: string) {
    const st = await this.findOne(tenantId, id);
    if (st.status !== 'REVIEW') {
      throw new BadRequestException('La auditoría debe estar en etapa de REVIEW para ser aplicada.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of st.items) {
        if (item.discrepancy !== null && item.discrepancy !== 0 && !item.applied) {
          
          // 1. Check if warehouse stock exists
          const ws = await tx.warehouseStock.findUnique({
            where: { warehouseId_productId: { warehouseId: st.warehouseId, productId: item.productId } }
          });

          if (!ws) {
             await tx.warehouseStock.create({
                data: {
                   warehouseId: st.warehouseId,
                   productId: item.productId,
                   stock: item.countedQty!
                }
             });
          } else {
             await tx.warehouseStock.update({
                where: { id: ws.id },
                data: { stock: item.countedQty! }
             });
          }

          // 2. Adjust total product stock (sum of all warehouses)
          const allStocks = await tx.warehouseStock.findMany({
            where: { productId: item.productId }
          });
          const totalStock = allStocks.reduce((sum, curr) => sum + curr.stock, 0);
          
          await tx.product.update({
             where: { id: item.productId },
             data: { stock: totalStock }
          });

          // 3. Register InventoryMovement
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: item.discrepancy > 0 ? 'IN' : 'OUT',
              quantity: Math.abs(item.discrepancy),
              reference: `Ajuste Auditoría ${st.id.substring(0, 8)}`,
            }
          });

          // 4. Mark item as applied
          await tx.stockTakeItem.update({
            where: { id: item.id },
            data: { applied: true }
          });
        }
      }

      await tx.stockTake.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
    });

    return this.findOne(tenantId, id);
  }
}
