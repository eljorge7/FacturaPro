import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, name: string, description?: string) {
    return this.prisma.department.create({
      data: {
        name,
        description,
        tenantId
      }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } }
    });
  }

  async remove(id: string, tenantId: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.delete({ where: { id } });
  }

  async update(id: string, tenantId: string, name: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, tenantId } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.update({
      where: { id },
      data: { name }
    });
  }

  async getPayrollStats(tenantId: string) {
    // 1. Gasto Real (Histórico de Nóminas Pagadas)
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

    const historicalCosts: Record<string, number> = {};
    for (const run of paidRuns) {
      for (const slip of run.payslips) {
        const dName = slip.employee?.departmentRef?.name || 'Sin Asignar';
        historicalCosts[dName] = (historicalCosts[dName] || 0) + slip.netPay;
      }
    }

    // 2. Proyección Actual (Basada en sueldos vigentes de empleados activos)
    const activeEmps = await this.prisma.employeeProfile.findMany({
      where: { tenantId, isActive: true },
      include: { departmentRef: true }
    });

    const projectedCosts: Record<string, number> = {};
    for (const e of activeEmps) {
       const dName = e.departmentRef?.name || 'Sin Asignar';
       projectedCosts[dName] = (projectedCosts[dName] || 0) + (e.baseSalary || 0);
    }

    // Unir todo en formato útil para las gráficas
    const allDeptNames = Array.from(new Set([...Object.keys(historicalCosts), ...Object.keys(projectedCosts)]));
    const finalData = allDeptNames.map(name => ({
       name,
       Historico: historicalCosts[name] || 0,
       Proyectado: projectedCosts[name] || 0
    }));

    return finalData;
  }
}
