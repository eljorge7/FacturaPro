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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExpensesService = class ExpensesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        if (tenantId === 'demo-tenant') {
            const firstTenant = await this.prisma.tenant.findFirst();
            if (firstTenant)
                tenantId = firstTenant.id;
        }
        return this.prisma.expense.findMany({
            where: { tenantId },
            include: {
                category: true,
                supplier: true,
            },
            orderBy: { date: 'desc' },
        });
    }
    async create(tenantId, data) {
        if (tenantId === 'demo-tenant') {
            const firstTenant = await this.prisma.tenant.findFirst();
            if (firstTenant)
                tenantId = firstTenant.id;
        }
        const { providerRfc, providerName, ...expenseData } = data;
        let supplierId = null;
        if (providerRfc) {
            let supplier = await this.prisma.supplier.findFirst({
                where: { tenantId, rfc: providerRfc }
            });
            if (!supplier) {
                supplier = await this.prisma.supplier.create({
                    data: {
                        tenantId,
                        rfc: providerRfc,
                        legalName: providerName || providerRfc
                    }
                });
            }
            supplierId = supplier.id;
        }
        try {
            return await this.prisma.expense.create({
                data: {
                    ...expenseData,
                    supplierId,
                    tenantId,
                },
            });
        }
        catch (e) {
            if (e.code === 'P2002' && e.meta?.target?.includes('satUuid')) {
                throw new common_1.BadRequestException('Esta factura (XML) ya ha sido registrada previamente en el sistema.');
            }
            throw e;
        }
    }
    async delete(id) {
        return this.prisma.expense.delete({
            where: { id }
        });
    }
    async parseXml(tenantId, fileContent) {
        if (tenantId === 'demo-tenant') {
            const firstTenant = await this.prisma.tenant.findFirst();
            if (firstTenant)
                tenantId = firstTenant.id;
        }
        const emisorStr = fileContent.match(/Emisor[^>]+>/i);
        let providerRfc = 'XAXX010101000', providerName = 'Proveedor Desconocido';
        if (emisorStr) {
            const rMatch = emisorStr[0].match(/Rfc="([^"]+)"/i);
            const nMatch = emisorStr[0].match(/Nombre="([^"]+)"/i);
            if (rMatch)
                providerRfc = rMatch[1];
            if (nMatch)
                providerName = nMatch[1];
        }
        const receptorStr = fileContent.match(/Receptor[^>]+>/i);
        let receiverRfc = '';
        if (receptorStr) {
            const rMatch = receptorStr[0].match(/Rfc="([^"]+)"/i);
            if (rMatch)
                receiverRfc = rMatch[1];
        }
        let isBelongingToTenant = true;
        let tenantRfcs = [];
        if (receiverRfc) {
            const taxProfiles = await this.prisma.taxProfile.findMany({
                where: { tenantId },
                select: { rfc: true }
            });
            tenantRfcs = taxProfiles.map(tp => tp.rfc.toUpperCase());
            if (tenantRfcs.length > 0 && !tenantRfcs.includes(receiverRfc.toUpperCase())) {
                isBelongingToTenant = false;
            }
        }
        const matchSubTotal = fileContent.match(/subtotal="([\d.]+)"/i) || fileContent.match(/SubTotal="([\d.]+)"/i);
        const matchTotal = fileContent.match(/\btotal="([\d.]+)"/i) || fileContent.match(/\bTotal="([\d.]+)"/i);
        const matchUuid = fileContent.match(/UUID="([^"]+)"/i) || fileContent.match(/UUID="([^"]+)"/i);
        const subtotal = matchSubTotal ? parseFloat(matchSubTotal[1]) : 0;
        const total = matchTotal ? parseFloat(matchTotal[1]) : 0;
        const taxTotal = Math.max(0, total - subtotal);
        const uuid = matchUuid ? matchUuid[1] : `SIMULATED-${Date.now()}`;
        return {
            providerRfc,
            providerName,
            subtotal,
            total,
            taxTotal,
            uuid,
            date: new Date(),
            isBelongingToTenant,
            receiverRfc,
            tenantRfcs,
            xmlContentRaw: fileContent
        };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map