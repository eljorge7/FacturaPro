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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, name, description) {
        return this.prisma.department.create({
            data: {
                name,
                description,
                tenantId
            }
        });
    }
    async findAll(tenantId) {
        return this.prisma.department.findMany({
            where: { tenantId },
            include: { _count: { select: { employees: true } } }
        });
    }
    async remove(id, tenantId) {
        const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return this.prisma.department.delete({ where: { id } });
    }
    async update(id, tenantId, name) {
        const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return this.prisma.department.update({
            where: { id },
            data: { name }
        });
    }
    async getPayrollStats(tenantId) {
        const paidRuns = await this.prisma.payrollRun.findMany({
            where: { tenantId, status: 'PAID' },
            include: {
                payslips: {
                    include: {
                        employee: { include: { departmentRef: true } }
                    }
                }
            }
        });
        const historicalCosts = {};
        for (const run of paidRuns) {
            for (const slip of run.payslips) {
                const dName = slip.employee?.departmentRef?.name || 'Sin Asignar';
                historicalCosts[dName] = (historicalCosts[dName] || 0) + slip.netPay;
            }
        }
        const activeEmps = await this.prisma.employeeProfile.findMany({
            where: { tenantId, isActive: true },
            include: { departmentRef: true }
        });
        const projectedCosts = {};
        for (const e of activeEmps) {
            const dName = e.departmentRef?.name || 'Sin Asignar';
            projectedCosts[dName] = (projectedCosts[dName] || 0) + (e.baseSalary || 0);
        }
        const allDeptNames = Array.from(new Set([...Object.keys(historicalCosts), ...Object.keys(projectedCosts)]));
        const finalData = allDeptNames.map(name => ({
            name,
            Historico: historicalCosts[name] || 0,
            Proyectado: projectedCosts[name] || 0
        }));
        return finalData;
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map