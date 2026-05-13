"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PurchasesService = class PurchasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllPurchases(tenantId) {
        return this.prisma.purchaseOrder.findMany({
            where: { tenantId },
            include: { supplier: true, items: { include: { product: true } }, serialNumbers: true, supplierPayments: true },
            orderBy: { orderDate: 'desc' }
        });
    }
    async createPurchase(tenantId, payload) {
        const total = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        return this.prisma.purchaseOrder.create({
            data: {
                tenantId,
                supplierId: payload.supplierId,
                status: 'PENDING',
                total,
                items: {
                    create: payload.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.quantity * item.unitCost
                    }))
                }
            }
        });
    }
    async deletePurchase(tenantId, orderId) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId }, include: { items: true } });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        if (order.status !== 'PENDING')
            throw new common_1.BadRequestException('Cannot delete an order that has partial or full receptions.');
        return this.prisma.purchaseOrder.delete({ where: { id: orderId } });
    }
    async updatePurchase(tenantId, orderId, payload) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId } });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        if (order.status !== 'PENDING')
            throw new common_1.BadRequestException('Cannot edit an order that has started receiving items.');
        await this.prisma.purchaseItem.deleteMany({ where: { purchaseOrderId: orderId } });
        const total = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        return this.prisma.purchaseOrder.update({
            where: { id: orderId },
            data: {
                supplierId: payload.supplierId,
                total,
                items: {
                    create: payload.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.quantity * item.unitCost
                    }))
                }
            }
        });
    }
    async receivePurchase(tenantId, orderId, providedItems) {
        const order = await this.prisma.purchaseOrder.findUnique({
            where: { id: orderId, tenantId },
            include: { items: { include: { product: true } } }
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        if (order.status === 'RECEIVED')
            throw new common_1.BadRequestException('Order already received');
        for (const pItem of providedItems) {
            const orderItem = order.items.find(i => i.id === pItem.itemId);
            if (!orderItem)
                continue;
            if (pItem.receivedNow <= 0)
                continue;
            if (orderItem.receivedQuantity + pItem.receivedNow > orderItem.quantity) {
                throw new common_1.BadRequestException(`Cannot receive more than requested for ${orderItem.product.name}`);
            }
            if (orderItem.product.hasSerials) {
                if (pItem.serials.length !== pItem.receivedNow) {
                    throw new common_1.BadRequestException(`El número de series proporcionado para ${orderItem.product.name} no coincide con la cantidad a recibir (${pItem.receivedNow}).`);
                }
                const existing = await this.prisma.serialNumber.findMany({
                    where: { productId: orderItem.product.id, serial: { in: pItem.serials } }
                });
                if (existing.length > 0)
                    throw new common_1.BadRequestException(`Las series ${existing.map((e) => e.serial).join(', ')} ya existen para este producto.`);
            }
        }
        return this.prisma.$transaction(async (tx) => {
            let allFullyReceived = true;
            for (const pItem of providedItems) {
                const orderItem = order.items.find(i => i.id === pItem.itemId);
                if (!orderItem || pItem.receivedNow <= 0) {
                    if (orderItem && orderItem.receivedQuantity < orderItem.quantity)
                        allFullyReceived = false;
                    continue;
                }
                const newReceivedQuantity = orderItem.receivedQuantity + pItem.receivedNow;
                if (newReceivedQuantity < orderItem.quantity)
                    allFullyReceived = false;
                await tx.purchaseItem.update({
                    where: { id: orderItem.id },
                    data: { receivedQuantity: newReceivedQuantity }
                });
                await tx.product.update({
                    where: { id: orderItem.product.id },
                    data: { stock: orderItem.product.stock + pItem.receivedNow }
                });
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        productId: orderItem.product.id,
                        type: 'IN',
                        quantity: pItem.receivedNow,
                        reference: `Recepción Parcial Orden Compra ${order.id}`
                    }
                });
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
            for (const orderItem of order.items) {
                const pItem = providedItems.find(p => p.itemId === orderItem.id);
                if (!pItem && orderItem.receivedQuantity < orderItem.quantity) {
                    allFullyReceived = false;
                }
            }
            await tx.purchaseOrder.update({
                where: { id: order.id },
                data: { status: allFullyReceived ? 'RECEIVED' : 'PARTIAL' }
            });
            return { success: true, status: allFullyReceived ? 'RECEIVED' : 'PARTIAL' };
        });
    }
    async addPayment(tenantId, orderId, payload) {
        const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId, tenantId } });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
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
            if (newAmountPaid >= order.total - 0.01)
                paymentStatus = "PAID";
            await tx.purchaseOrder.update({
                where: { id: order.id },
                data: { amountPaid: newAmountPaid, paymentStatus }
            });
            return payment;
        });
    }
    async getApReport(tenantId) {
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
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map