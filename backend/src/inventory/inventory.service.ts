import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) {}

    async getAllMovements(tenantId: string) {
        return this.prisma.inventoryMovement.findMany({
            where: { tenantId },
            include: {
                product: {
                    select: { name: true, sku: true, supplierSku: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async quickReceive(tenantId: string, payload: { productId: string, quantity: number, reference: string, batchNumber?: string, expiryDate?: string }[]) {
        const results = [];
        for (const item of payload) {
            if (item.quantity <= 0) continue;
            
            // 1. Aumentar stock global
            const updated = await this.prisma.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
            });
            
            // 1.5 Crear Lote si se proporcionó caducidad
            if (item.expiryDate) {
                await this.prisma.productBatch.create({
                    data: {
                        tenantId,
                        productId: item.productId,
                        batchNumber: item.batchNumber || null,
                        expiryDate: new Date(item.expiryDate),
                        stock: item.quantity
                    }
                });
            }

            // 2. Registrar movimiento de entrada (Kardex)
            // @ts-ignore
            await this.prisma.inventoryMovement.create({
                data: {
                    tenantId,
                    productId: item.productId,
                    type: 'IN',
                    quantity: item.quantity,
                    reference: item.reference || 'Recepción Rápida Mostrador'
                }
            });
            results.push(updated);
        }
        return results;
    }
}
