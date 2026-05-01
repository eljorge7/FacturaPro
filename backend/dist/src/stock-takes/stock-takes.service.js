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
exports.StockTakesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StockTakesService = class StockTakesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
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
            throw new common_1.BadRequestException('No hay productos disponibles para auditar en esta selección.');
        }
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
    async findAll(tenantId) {
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
    async findOne(tenantId, id) {
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
        if (!st)
            throw new common_1.NotFoundException('StockTake not found');
        return st;
    }
    async submitCounts(tenantId, id, counts) {
        const st = await this.findOne(tenantId, id);
        if (st.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Esta auditoría ya no está en progreso.');
        }
        await this.prisma.$transaction(async (tx) => {
            for (const c of counts) {
                const item = st.items.find(i => i.id === c.itemId);
                if (!item)
                    continue;
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
    async applyAdjustments(tenantId, id) {
        const st = await this.findOne(tenantId, id);
        if (st.status !== 'REVIEW') {
            throw new common_1.BadRequestException('La auditoría debe estar en etapa de REVIEW para ser aplicada.');
        }
        await this.prisma.$transaction(async (tx) => {
            for (const item of st.items) {
                if (item.discrepancy !== null && item.discrepancy !== 0 && !item.applied) {
                    const ws = await tx.warehouseStock.findUnique({
                        where: { warehouseId_productId: { warehouseId: st.warehouseId, productId: item.productId } }
                    });
                    if (!ws) {
                        await tx.warehouseStock.create({
                            data: {
                                warehouseId: st.warehouseId,
                                productId: item.productId,
                                stock: item.countedQty
                            }
                        });
                    }
                    else {
                        await tx.warehouseStock.update({
                            where: { id: ws.id },
                            data: { stock: item.countedQty }
                        });
                    }
                    const allStocks = await tx.warehouseStock.findMany({
                        where: { productId: item.productId }
                    });
                    const totalStock = allStocks.reduce((sum, curr) => sum + curr.stock, 0);
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: totalStock }
                    });
                    await tx.inventoryMovement.create({
                        data: {
                            tenantId,
                            productId: item.productId,
                            type: item.discrepancy > 0 ? 'IN' : 'OUT',
                            quantity: Math.abs(item.discrepancy),
                            reference: `Ajuste Auditoría ${st.id.substring(0, 8)}`,
                        }
                    });
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
};
exports.StockTakesService = StockTakesService;
exports.StockTakesService = StockTakesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockTakesService);
//# sourceMappingURL=stock-takes.service.js.map