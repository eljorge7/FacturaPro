import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
    constructor(private prisma: PrismaService) {}

    async getAllPurchases(tenantId: string) {
        return this.prisma.purchaseOrder.findMany({
            where: { tenantId },
            include: { supplier: true, items: { include: { product: true } }, serialNumbers: true, supplierPayments: true },
            orderBy: { orderDate: 'desc' }
        });
    }

    async createPurchase(tenantId: string, payload: any) {
        // expect payload to have supplierId, items: [{ productId, quantity, unitCost }]
        const total = payload.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);
        return this.prisma.purchaseOrder.create({
            data: {
                tenantId,
                supplierId: payload.supplierId,
                status: 'PENDING',
                total,
                items: {
                    create: payload.items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.quantity * item.unitCost
                    }))
                }
            }
        });
    }

    async deletePurchase(tenantId: string, orderId: string) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId }, include: { items: true }});
        if (!order) throw new BadRequestException('Order not found');
        if (order.status !== 'PENDING') throw new BadRequestException('Cannot delete an order that has partial or full receptions.');
        return this.prisma.purchaseOrder.delete({ where: { id: orderId } });
    }

    async updatePurchase(tenantId: string, orderId: string, payload: any) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId } });
        if (!order) throw new BadRequestException('Order not found');
        if (order.status !== 'PENDING') throw new BadRequestException('Cannot edit an order that has started receiving items.');

        // A simple implementation: delete items and recreate them, updating total and supplierId.
        await this.prisma.purchaseItem.deleteMany({ where: { purchaseOrderId: orderId } });

        const total = payload.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);
        return this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: {
                supplierId: payload.supplierId,
                total,
                items: {
                    create: payload.items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.quantity * item.unitCost
                    }))
                }
            }
        });
    }

    async receivePurchase(tenantId: string, orderId: string, providedItems: { itemId: string, receivedNow: number, serials: string[] }[]) {
        const order = await this.prisma.purchaseOrder.findUnique({
             where: { id: orderId, tenantId },
             include: { items: { include: { product: true } } }
        });
        if (!order) throw new BadRequestException('Order not found');
        if (order.status === 'RECEIVED') throw new BadRequestException('Order already received');

        // Validation Step
        for (const pItem of providedItems) {
             const orderItem = order.items.find(i => i.id === pItem.itemId);
             if (!orderItem) continue;
             
             if (pItem.receivedNow <= 0) continue;
             if (orderItem.receivedQuantity + pItem.receivedNow > orderItem.quantity) {
                 throw new BadRequestException(`Cannot receive more than requested for ${orderItem.product.name}`);
             }

             if (orderItem.product.hasSerials) {
                 if (pItem.serials.length !== pItem.receivedNow) {
                     throw new BadRequestException(`El número de series proporcionado para ${orderItem.product.name} no coincide con la cantidad a recibir (${pItem.receivedNow}).`);
                 }
                 // Validate no duplicates
                 const existing = await this.prisma.serialNumber.findMany({
                     where: { productId: orderItem.product.id, serial: { in: pItem.serials } }
                 });
                 if (existing.length > 0) throw new BadRequestException(`Las series ${existing.map((e: any) => e.serial).join(', ')} ya existen para este producto.`);
             }
        }

        // Process within a transaction
        return this.prisma.$transaction(async (tx) => {
             let allFullyReceived = true;

             for (const pItem of providedItems) {
                 const orderItem = order.items.find(i => i.id === pItem.itemId);
                 if (!orderItem || pItem.receivedNow <= 0) {
                     if (orderItem && orderItem.receivedQuantity < orderItem.quantity) allFullyReceived = false;
                     continue;
                 }

                 const newReceivedQuantity = orderItem.receivedQuantity + pItem.receivedNow;
                 if (newReceivedQuantity < orderItem.quantity) allFullyReceived = false;

                 // Update Item
                 await tx.purchaseItem.update({
                     where: { id: orderItem.id },
                     data: { receivedQuantity: newReceivedQuantity }
                 });

                 // Update Stock 
                 await tx.product.update({
                     where: { id: orderItem.product.id },
                     data: { stock: orderItem.product.stock + pItem.receivedNow }
                 });

                 // Add Kardex IN
                 await tx.inventoryMovement.create({
                     data: {
                        tenantId,
                        productId: orderItem.product.id,
                        type: 'IN',
                        quantity: pItem.receivedNow,
                        reference: `Recepción Parcial Orden Compra ${order.id}`
                     }
                 });

                 // Insert serials
                 if (orderItem.product.hasSerials && pItem.serials) {
                     for (const s of pItem.serials) {
                         await tx.serialNumber.create({
                             data: {
                                productId: orderItem.product.id,
                                purchaseOrderId: order.id,
                                serial: s,
                                status: 'AVAILABLE'
                             }
                         });
                     }
                 }
             }
             
             // Check items that were not in providedItems but exist in order
             for (const orderItem of order.items) {
                 const pItem = providedItems.find(p => p.itemId === orderItem.id);
                 if (!pItem && orderItem.receivedQuantity < orderItem.quantity) {
                     allFullyReceived = false;
                 }
             }

             // update order status
             await tx.purchaseOrder.update({
                 where: { id: order.id },
                 data: { status: allFullyReceived ? 'RECEIVED' : 'PARTIAL' }
             });

             return { success: true, status: allFullyReceived ? 'RECEIVED' : 'PARTIAL' };
        });
    }

    async addPayment(tenantId: string, orderId: string, payload: { amount: number, paymentMethod?: string, reference?: string, notes?: string }) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId } });
        if (!order) throw new BadRequestException('Order not found');

        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.supplierPayment.create({
                data: {
                    purchaseOrderId: order.id,
                    amount: payload.amount,
                    paymentMethod: payload.paymentMethod || "03",
                    reference: payload.reference,
                    notes: payload.notes
                }
            });

            const newAmountPaid = (order.amountPaid || 0) + payload.amount;
            let paymentStatus = "PARTIAL";
            // allow a small margin of error for floats
            if (newAmountPaid >= order.total - 0.01) paymentStatus = "PAID";

            await tx.purchaseOrder.update({
                where: { id: order.id },
                data: { amountPaid: newAmountPaid, paymentStatus }
            });

            return payment;
        });
    }

    async getApReport(tenantId: string) {
        const payments = await this.prisma.supplierPayment.findMany({
            where: { purchaseOrder: { tenantId } },
            include: { purchaseOrder: { include: { supplier: true } } },
            orderBy: { paymentDate: 'desc' }
        });

        const pendingOrders = await this.prisma.purchaseOrder.findMany({
            where: { tenantId, paymentStatus: { in: ['UNPAID', 'PARTIAL'] }, status: { not: 'CANCELLED' } },
            include: { supplier: true },
            orderBy: { orderDate: 'desc' }
        });

        const totalDebt = pendingOrders.reduce((sum, o) => sum + Math.max(0, o.total - (o.amountPaid || 0)), 0);

        return { payments, pendingOrders, totalDebt };
    }
}
