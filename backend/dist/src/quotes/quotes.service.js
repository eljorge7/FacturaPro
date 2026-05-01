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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotesService = class QuotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createQuoteDto) {
        let { tenantId, customerId, items, notes, expirationDate, taxIncluded } = createQuoteDto;
        if (!tenantId) {
            const tenantFallback = await this.prisma.tenant.findFirst();
            if (!tenantFallback)
                throw new common_1.BadRequestException('El sistema no tiene Empresa configurada.');
            tenantId = tenantFallback.id;
        }
        let taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId } });
        if (!taxProfile) {
            taxProfile = await this.prisma.taxProfile.create({
                data: { tenantId, rfc: 'XAXX010101000', legalName: 'Mi Empresa', taxRegime: '601', zipCode: '00000' }
            });
        }
        const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer)
            throw new common_1.NotFoundException('Cliente no encontrado');
        let subtotal = 0;
        let taxTotal = 0;
        const quoteItemsData = items.map(item => {
            const discount = item.discount || 0;
            let lineTotal = 0;
            let lineSubtotal = 0;
            let lineTaxes = 0;
            if (taxIncluded) {
                lineTotal = (item.quantity * item.unitPrice) - discount;
                lineSubtotal = lineTotal / (1 + item.taxRate);
                lineTaxes = lineTotal - lineSubtotal;
            }
            else {
                lineSubtotal = (item.quantity * item.unitPrice) - discount;
                lineTaxes = lineSubtotal * item.taxRate;
                lineTotal = lineSubtotal + lineTaxes;
            }
            subtotal += lineSubtotal;
            taxTotal += lineTaxes;
            return {
                productId: item.productId || null,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: discount,
                taxRate: item.taxRate,
                total: lineTotal
            };
        });
        const total = subtotal + taxTotal;
        let quoteNumber = createQuoteDto.quoteNumber;
        if (!quoteNumber || quoteNumber.trim() === '') {
            const series = await this.prisma.invoiceSeries.findFirst({
                where: { tenantId, type: 'QUOTE', isDefault: true }
            });
            if (series) {
                quoteNumber = `${series.prefix}${series.nextFolio}`;
                await this.prisma.invoiceSeries.update({
                    where: { id: series.id },
                    data: { nextFolio: series.nextFolio + 1 }
                });
            }
            else {
                quoteNumber = `COT-${Date.now().toString().slice(-6)}`;
            }
        }
        return this.prisma.quote.create({
            data: {
                tenantId,
                taxProfileId: taxProfile.id,
                customerId,
                quoteNumber,
                status: 'DRAFT',
                subtotal,
                taxTotal,
                total,
                notes,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                items: {
                    create: quoteItemsData
                }
            },
            include: { items: true, customer: true, taxProfile: true }
        });
    }
    async findAll(tenantId) {
        let whereFilter = {};
        if (tenantId && tenantId !== 'demo-tenant') {
            whereFilter = { tenantId };
        }
        return this.prisma.quote.findMany({
            where: whereFilter,
            include: { customer: true, items: true, taxProfile: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id) {
        const q = await this.prisma.quote.findUnique({
            where: { id },
            include: { items: true, customer: true, taxProfile: true }
        });
        if (!q)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return q;
    }
    async updateStatus(id, updateQuoteDto) {
        return this.prisma.quote.update({
            where: { id },
            data: { status: updateQuoteDto.status }
        });
    }
    remove(id) {
        return this.prisma.quote.delete({ where: { id } });
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map