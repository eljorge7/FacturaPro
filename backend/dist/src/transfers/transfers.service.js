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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransfersService = class TransfersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.$transaction(async (tx) => {
            for (const item of data.items) {
                const ws = await tx.warehouseStock.findUnique({
                    where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: item.productId } }
                });
                if (!ws || ws.stock < item.quantity) {
                    const p = await tx.product.findUnique({ where: { id: item.productId } });
                    throw new common_1.BadRequestException(`Sin stock suficiente en la sucursal de origen para: ${p?.name}`);
                }
            }
            for (const item of data.items) {
                await tx.warehouseStock.update({
                    where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: item.productId } },
                    data: { stock: { decrement: item.quantity } }
                });
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
            return tx.transferOrder.create({
                data: {
                    tenantId,
                    fromWarehouseId: data.fromWarehouseId,
                    toWarehouseId: data.toWarehouseId,
                    status: 'IN_TRANSIT',
                    reference: data.reference,
                    items: {
                        create: data.items.map((i) => ({
                            productId: i.productId,
                            quantity: i.quantity
                        }))
                    }
                }
            });
        });
    }
    findAll(tenantId) {
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
    async receive(tenantId, id, itemsRecv) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.transferOrder.findUnique({ where: { id, tenantId }, include: { items: true } });
            if (!order)
                throw new common_1.NotFoundException('Traspaso no encontrado');
            if (order.status !== 'IN_TRANSIT')
                throw new common_1.BadRequestException('El traspaso no está en ruta');
            let hasDiscrepancy = false;
            for (const recv of itemsRecv) {
                const orderItem = order.items.find(i => i.id === recv.itemId);
                if (!orderItem)
                    continue;
                if (recv.receivedQty < orderItem.quantity)
                    hasDiscrepancy = true;
                else if (recv.receivedQty > orderItem.quantity)
                    throw new common_1.BadRequestException('No puedes recibir más de lo enviado');
                await tx.transferItem.update({
                    where: { id: orderItem.id },
                    data: { receivedQty: recv.receivedQty }
                });
                if (recv.receivedQty > 0) {
                    await tx.warehouseStock.upsert({
                        where: { warehouseId_productId: { warehouseId: order.toWarehouseId, productId: orderItem.productId } },
                        create: { warehouseId: order.toWarehouseId, productId: orderItem.productId, stock: recv.receivedQty },
                        update: { stock: { increment: recv.receivedQty } }
                    });
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
    async resolveDiscrepancy(tenantId, id, action) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.transferOrder.findUnique({ where: { id, tenantId }, include: { items: true } });
            if (!order || order.status !== 'DISCREPANCY')
                throw new common_1.BadRequestException('No aplica resolución');
            for (const item of order.items) {
                const diff = item.quantity - item.receivedQty;
                if (diff > 0) {
                    if (action === 'MERMA') {
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
                    }
                    else {
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
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map