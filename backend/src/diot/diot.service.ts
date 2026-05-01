import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiotService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // IVA Cobrado (Facturas Pagadas de este mes) - Simplificando a nivel de Factura
    // En el schema actual "Invoice" status = "PAID"
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: startOfMonth }
      }
    });

    const ivaCobrado = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);

    // IVA Pagado (Gastos deducibles de este mes)
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
}
