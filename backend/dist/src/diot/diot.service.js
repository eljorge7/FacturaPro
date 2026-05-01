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
exports.DiotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DiotService = class DiotService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(tenantId) {
        if (tenantId === 'demo-tenant') {
            const firstTenant = await this.prisma.tenant.findFirst();
            if (firstTenant)
                tenantId = firstTenant.id;
        }
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const invoices = await this.prisma.invoice.findMany({
            where: {
                tenantId,
                status: 'PAID',
                createdAt: { gte: startOfMonth }
            }
        });
        const ivaCobrado = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
        const expenses = await this.prisma.expense.findMany({
            where: {
                tenantId,
                isDeductible: true,
                date: { gte: startOfMonth }
            }
        });
        const ivaPagado = expenses.reduce((sum, exp) => sum + exp.taxTotal, 0);
        return {
            ivaCobrado,
            ivaPagado,
            totalAPagar: Math.max(0, ivaCobrado - ivaPagado),
            saldoAFavor: Math.max(0, ivaPagado - ivaCobrado)
        };
    }
};
exports.DiotService = DiotService;
exports.DiotService = DiotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiotService);
//# sourceMappingURL=diot.service.js.map