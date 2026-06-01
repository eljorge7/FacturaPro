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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCustomerDto) {
        const { tenantId, legalName, rfc } = createCustomerDto;
        if (tenantId) {
            const existing = await this.prisma.customer.findFirst({
                where: { tenantId, rfc, legalName }
            });
            if (existing) {
                throw new common_1.BadRequestException('Ya existe un cliente con este nombre y RFC en el catálogo.');
            }
        }
        return this.prisma.customer.create({
            data: createCustomerDto,
        });
    }
    async createBulk(tenantId, data) {
        if (tenantId === 'demo-tenant') {
            const firstTenant = await this.prisma.tenant.findFirst();
            if (firstTenant)
                tenantId = firstTenant.id;
        }
        const mapData = data.map(c => ({
            ...c,
            tenantId
        }));
        return this.prisma.customer.createMany({
            data: mapData,
            skipDuplicates: true
        });
    }
    async findAll(tenantId) {
        let whereFilter = {};
        if (tenantId && tenantId !== 'demo-tenant') {
            whereFilter = { tenantId };
        }
        return this.prisma.customer.findMany({
            where: whereFilter,
            orderBy: { legalName: 'asc' }
        });
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Customer no encontrado');
        return customer;
    }
    async update(id, updateCustomerDto) {
        await this.findOne(id);
        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.customer.delete({
            where: { id },
        });
    }
    async updateCreditConfig(id, creditEnabled, creditLimit, creditDays, creditStatus) {
        await this.findOne(id);
        return this.prisma.customer.update({
            where: { id },
            data: {
                creditEnabled,
                creditLimit,
                creditDays,
                creditStatus
            }
        });
    }
    async getCreditStatement(id) {
        const customer = await this.findOne(id);
        const unpaidInvoices = await this.prisma.invoice.findMany({
            where: {
                customerId: id,
                paymentMethod: '99',
                status: 'UNPAID'
            },
            orderBy: { date: 'asc' },
            include: { items: true, payments: true }
        });
        let currentDebt = 0;
        for (const inv of unpaidInvoices) {
            const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
            currentDebt += (inv.total - paid);
        }
        return {
            customer: {
                id: customer.id,
                name: customer.legalName,
                creditEnabled: customer.creditEnabled,
                creditLimit: customer.creditLimit,
                creditDays: customer.creditDays,
                creditStatus: customer.creditStatus,
                availableCredit: customer.creditLimit - currentDebt,
                currentDebt
            },
            unpaidInvoices
        };
    }
    async registerCreditPayment(id, amount, paymentMethod, notes) {
        await this.findOne(id);
        if (amount <= 0)
            throw new common_1.BadRequestException('El monto debe ser mayor a 0');
        const unpaidInvoices = await this.prisma.invoice.findMany({
            where: { customerId: id, paymentMethod: '99', status: 'UNPAID' },
            orderBy: { date: 'asc' },
            include: { payments: true }
        });
        let remainingAmount = amount;
        const paymentsCreated = [];
        for (const inv of unpaidInvoices) {
            if (remainingAmount <= 0)
                break;
            const alreadyPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
            const debt = inv.total - alreadyPaid;
            const paymentToApply = Math.min(remainingAmount, debt);
            const payment = await this.prisma.payment.create({
                data: {
                    invoiceId: inv.id,
                    amount: paymentToApply,
                    paymentMethod,
                    notes: notes || 'Abono a cuenta'
                }
            });
            paymentsCreated.push(payment);
            remainingAmount -= paymentToApply;
            const newPaid = alreadyPaid + paymentToApply;
            if (newPaid >= inv.total - 0.01) {
                await this.prisma.invoice.update({
                    where: { id: inv.id },
                    data: { status: 'PAID' }
                });
            }
        }
        return {
            success: true,
            amountApplied: amount - remainingAmount,
            remainingChange: remainingAmount,
            payments: paymentsCreated
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map