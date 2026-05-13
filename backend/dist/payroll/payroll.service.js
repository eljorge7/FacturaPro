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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PayrollService = class PayrollService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.payrollRun.findMany({
            where: { tenantId },
            orderBy: { periodStart: 'desc' },
            include: {
                _count: { select: { payslips: true } }
            }
        });
    }
    async findOne(tenantId, id) {
        const run = await this.prisma.payrollRun.findFirst({
            where: { tenantId, id },
            include: {
                payslips: {
                    include: {
                        employee: true
                    }
                }
            }
        });
        if (!run)
            throw new common_1.NotFoundException('Nómina no encontrada');
        return run;
    }
    async createDraft(tenantId, periodStart, periodEnd) {
        const employees = await this.prisma.employeeProfile.findMany({
            where: { tenantId, isActive: true, baseSalary: { gt: 0 } }
        });
        if (employees.length === 0) {
            throw new common_1.BadRequestException('No hay empleados activos con sueldo mayor a $0.');
        }
        return this.prisma.$transaction(async (tx) => {
            const run = await tx.payrollRun.create({
                data: {
                    tenantId,
                    periodStart: new Date(periodStart),
                    periodEnd: new Date(periodEnd),
                    status: 'DRAFT'
                }
            });
            let totalRunAmount = 0;
            for (const emp of employees) {
                const basePay = emp.baseSalary || 0;
                totalRunAmount += basePay;
                await tx.payslip.create({
                    data: {
                        payrollRunId: run.id,
                        employeeId: emp.id,
                        baseSalary: basePay,
                        bonuses: 0,
                        deductions: 0,
                        netPay: basePay,
                        status: 'DRAFT'
                    }
                });
            }
            await tx.payrollRun.update({
                where: { id: run.id },
                data: { totalAmount: totalRunAmount }
            });
            return run;
        });
    }
    async unrollDraft(tenantId, id) {
        const run = await this.findOne(tenantId, id);
        if (run.status === 'PAID')
            throw new common_1.BadRequestException('No puedes borrar una nómina pagada. Rastro de Auditoría requerido.');
        return this.prisma.payrollRun.delete({ where: { id } });
    }
    async updatePayslip(tenantId, runId, payslipId, data) {
        const run = await this.findOne(tenantId, runId);
        if (run.status === 'PAID')
            throw new common_1.BadRequestException('La nómina ya está pagada. Modificación denegada.');
        const newNetPay = (data.baseSalary || 0) + (data.bonuses || 0) - (data.deductions || 0);
        const updated = await this.prisma.payslip.update({
            where: { id: payslipId },
            data: {
                baseSalary: data.baseSalary,
                bonuses: data.bonuses,
                deductions: data.deductions,
                netPay: newNetPay
            }
        });
        const allPayslips = await this.prisma.payslip.findMany({ where: { payrollRunId: runId } });
        const newTotal = allPayslips.reduce((sum, p) => sum + p.netPay, 0);
        await this.prisma.payrollRun.update({
            where: { id: runId },
            data: { totalAmount: newTotal }
        });
        return updated;
    }
    async executePayRun(tenantId, runId) {
        return this.prisma.$transaction(async (tx) => {
            const run = await tx.payrollRun.findFirst({
                where: { tenantId, id: runId },
                include: { payslips: { include: { employee: true } } }
            });
            if (!run)
                throw new common_1.NotFoundException();
            if (run.status === 'PAID')
                throw new common_1.BadRequestException('Ya fue pagada.');
            for (const slip of run.payslips) {
                const signature = `SIGNED-${Date.now()}-${slip.id.split('-')[0]}-${slip.netPay}`;
                await tx.payslip.update({
                    where: { id: slip.id },
                    data: { status: 'PAID', auditSignature: signature }
                });
            }
            await tx.payrollRun.update({
                where: { id: runId },
                data: { status: 'PAID', paymentDate: new Date() }
            });
            let category = await tx.expenseCategory.findFirst({
                where: { tenantId, name: 'Nómina' }
            });
            if (!category) {
                category = await tx.expenseCategory.create({
                    data: { tenantId, name: 'Nómina' }
                });
            }
            await tx.expense.create({
                data: {
                    tenantId,
                    categoryId: category.id,
                    amount: run.totalAmount,
                    total: run.totalAmount,
                    description: `Dispersión de Nómina NOM-${run.id.split('-')[0].toUpperCase()} - ${run.periodStart.toISOString().split('T')[0]} / ${run.periodEnd.toISOString().split('T')[0]}`,
                    date: new Date(),
                    status: 'PAID'
                }
            });
            return { success: true, message: 'Nómina pagada, bloqueada, y deducida en estado de cuenta corporativo.' };
        });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map