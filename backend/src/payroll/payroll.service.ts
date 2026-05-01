import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.payrollRun.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'desc' },
      include: {
        _count: { select: { payslips: true } }
      }
    });
  }

  async findOne(tenantId: string, id: string) {
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
    if (!run) throw new NotFoundException('Nómina no encontrada');
    return run;
  }

  async createDraft(tenantId: string, periodStart: string, periodEnd: string) {
    // Buscar a todos los empleados activos de PLANTA o CONTRATISTAS con sueldo configurado
    const employees = await this.prisma.employeeProfile.findMany({
      where: { tenantId, isActive: true, baseSalary: { gt: 0 } }
    });

    if (employees.length === 0) {
      throw new BadRequestException('No hay empleados activos con sueldo mayor a $0.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create RUN
      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          status: 'DRAFT'
        }
      });

      let totalRunAmount = 0;

      // Create Payslips
      for (const emp of employees) {
        // En un caso real aquí multiplicaríamos el sueldo base x días trabajados
        // Por ahora, usamos el sueldo directo como sueldo de la quincena/periodo.
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

  async unrollDraft(tenantId: string, id: string) {
    const run = await this.findOne(tenantId, id);
    if (run.status === 'PAID') throw new BadRequestException('No puedes borrar una nómina pagada. Rastro de Auditoría requerido.');
    
    return this.prisma.payrollRun.delete({ where: { id } });
  }

  async updatePayslip(tenantId: string, runId: string, payslipId: string, data: any) {
    const run = await this.findOne(tenantId, runId);
    if (run.status === 'PAID') throw new BadRequestException('La nómina ya está pagada. Modificación denegada.');

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

    // Recalcular total del Run
    const allPayslips = await this.prisma.payslip.findMany({ where: { payrollRunId: runId } });
    const newTotal = allPayslips.reduce((sum, p) => sum + p.netPay, 0);

    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { totalAmount: newTotal }
    });

    return updated;
  }

  async executePayRun(tenantId: string, runId: string) {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.findFirst({
        where: { tenantId, id: runId },
        include: { payslips: { include: { employee: true } } }
      });
      if (!run) throw new NotFoundException();
      if (run.status === 'PAID') throw new BadRequestException('Ya fue pagada.');

      // 1. Firmar los payslips y marcarlos como pagados
      for (const slip of run.payslips) {
        const signature = `SIGNED-${Date.now()}-${slip.id.split('-')[0]}-${slip.netPay}`;
        await tx.payslip.update({
          where: { id: slip.id },
          data: { status: 'PAID', auditSignature: signature }
        });
      }

      // 2. Cerrar el Payroll Run
      await tx.payrollRun.update({
        where: { id: runId },
        data: { status: 'PAID', paymentDate: new Date() }
      });

      // 3. Crear el Gasto Automático en Contabilidad (A partir de la decisión del Usuario)
      // Buscamos o creamos la categoría "Nómina"
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
}
