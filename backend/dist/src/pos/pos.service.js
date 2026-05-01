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
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const invoices_service_1 = require("../invoices/invoices.service");
let PosService = class PosService {
    prisma;
    invoicesService;
    constructor(prisma, invoicesService) {
        this.prisma = prisma;
        this.invoicesService = invoicesService;
    }
    async checkout(tenantId, payload) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant || !tenant.hasPosAccess) {
            throw new common_1.BadRequestException('Esta empresa no tiene el módulo de Punto de Venta activo. Haz Upgrade a tu plan.');
        }
        const { items, paymentMethod, paymentForm, ticketNotes, cashShiftId, customFields } = payload;
        if (!items || items.length === 0)
            throw new common_1.BadRequestException('El carrito está vacío');
        for (const item of items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
                include: { kitComponents: true }
            });
            if (!product)
                throw new common_1.BadRequestException(`Producto no encontrado`);
            if (product.type === 'KIT' || product.type === 'SERVICE') {
                for (const comp of product.kitComponents) {
                    const child = await this.prisma.product.findUnique({ where: { id: comp.childProductId } });
                    if (child && child.trackInventory) {
                        const qtyNeeded = comp.quantity * item.quantity;
                        if (child.stock < qtyNeeded) {
                            throw new common_1.BadRequestException(`Falta inventario del componente ${child.name} para completar: ${product.name}.`);
                        }
                        await this.prisma.product.update({
                            where: { id: child.id },
                            data: { stock: { decrement: qtyNeeded } }
                        });
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
            }
            else if (product.trackInventory) {
                if (product.stock < item.quantity) {
                    throw new common_1.BadRequestException(`Inventario insuficiente para ${product.name}. Quedan ${product.stock}`);
                }
                if (product.hasSerials) {
                    if (!item.serials || item.serials.length !== item.quantity) {
                        throw new common_1.BadRequestException(`Debe proporcionar ${item.quantity} números de serie para ${product.name}`);
                    }
                    for (const serial of item.serials) {
                        const serialDb = await this.prisma.serialNumber.findUnique({
                            where: { productId_serial: { productId: product.id, serial } }
                        });
                        if (!serialDb || serialDb.status !== 'AVAILABLE') {
                            throw new common_1.BadRequestException(`La serie ${serial} de ${product.name} no está disponible.`);
                        }
                        await this.prisma.serialNumber.update({
                            where: { id: serialDb.id },
                            data: { status: 'SOLD', soldAt: new Date() }
                        });
                    }
                }
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
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
        return this.invoicesService.create({
            tenantId,
            customerId: publicoGen.id,
            paymentMethod: paymentMethod || 'PUE',
            paymentForm: paymentForm || '01',
            cfdiUse: 'S01',
            items: items.map((i) => ({
                productId: i.productId,
                description: i.description || i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount || 0,
                taxRate: 0.16
            })),
            status: 'DRAFT',
            ...(cashShiftId && { cashShiftId }),
            ...(customFields && { customFields })
        });
    }
    async getCurrentShift(tenantId) {
        return this.prisma.cashShift.findFirst({
            where: { tenantId, status: 'OPEN' },
            include: { openedBy: { select: { id: true, name: true, email: true } } }
        });
    }
    async openShift(tenantId, payload) {
        const existing = await this.getCurrentShift(tenantId);
        if (existing)
            throw new common_1.BadRequestException('Ya existe un turno abierto. Ciérralo primero.');
        return this.prisma.cashShift.create({
            data: {
                tenantId,
                openedById: payload.userId,
                startingCash: payload.startingCash
            }
        });
    }
    async getShiftSummary(tenantId, shiftId) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId, tenantId },
            include: {
                invoices: true,
                movements: true,
                openedBy: true
            }
        });
        if (!shift)
            throw new common_1.BadRequestException('Turno no encontrado');
        let cashSales = 0;
        let cardSales = 0;
        let transferSales = 0;
        for (const inv of shift.invoices) {
            if (inv.status !== 'CANCELADA') {
                if (inv.paymentForm === '01')
                    cashSales += inv.total;
                else if (inv.paymentForm === '04' || inv.paymentForm === '28' || inv.paymentForm === '04')
                    cardSales += inv.total;
                else if (inv.paymentForm === '03')
                    transferSales += inv.total;
                else
                    cashSales += inv.total;
            }
        }
        let cashIn = 0;
        let cashOut = 0;
        for (const mov of shift.movements) {
            if (mov.type === 'IN')
                cashIn += mov.amount;
            if (mov.type === 'OUT')
                cashOut += mov.amount;
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
    async closeShift(tenantId, shiftId, userId) {
        return this.prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                closedById: userId
            }
        });
    }
    async addMovement(tenantId, shiftId, payload) {
        return this.prisma.cashMovement.create({
            data: {
                cashShiftId: shiftId,
                type: payload.type,
                amount: payload.amount,
                reason: payload.reason
            }
        });
    }
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        invoices_service_1.InvoicesService])
], PosService);
//# sourceMappingURL=pos.service.js.map