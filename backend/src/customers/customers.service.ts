import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { tenantId, legalName, rfc } = createCustomerDto;
    if (tenantId) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, rfc, legalName }
      });
      if (existing) {
        throw new BadRequestException('Ya existe un cliente con este nombre y RFC en el catálogo.');
      }
    }

    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async createBulk(tenantId: string, data: any[]) {
    // Demo-tenant support
    if (tenantId === 'demo-tenant') {
      const firstTenant = await this.prisma.tenant.findFirst();
      if (firstTenant) tenantId = firstTenant.id;
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

  async findAll(tenantId: string) {
    let whereFilter = {};
    if (tenantId && tenantId !== 'demo-tenant') {
       whereFilter = { tenantId };
    }
    return this.prisma.customer.findMany({
      where: whereFilter,
      orderBy: { legalName: 'asc' }
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer no encontrado');
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }

  // --- MÓDULO DE FIADO (CRÉDITO A CLIENTES) ---

  async updateCreditConfig(id: string, creditEnabled: boolean, creditLimit: number, creditDays: number, creditStatus: string) {
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

  async getCreditStatement(id: string) {
    const customer = await this.findOne(id);
    
    // Obtenemos todos los tickets/facturas no pagados asociados al crédito (Método 99)
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        customerId: id,
        paymentMethod: '99',
        status: 'UNPAID'
      },
      orderBy: { date: 'asc' },
      include: { items: true, payments: true }
    });

    // Calculamos el total adeudado
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

  async registerCreditPayment(id: string, amount: number, paymentMethod: string, notes?: string) {
    await this.findOne(id);
    if (amount <= 0) throw new BadRequestException('El monto debe ser mayor a 0');

    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: { customerId: id, paymentMethod: '99', status: 'UNPAID' },
      orderBy: { date: 'asc' },
      include: { payments: true }
    });

    let remainingAmount = amount;
    const paymentsCreated = [];

    for (const inv of unpaidInvoices) {
      if (remainingAmount <= 0) break;

      const alreadyPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const debt = inv.total - alreadyPaid;
      
      const paymentToApply = Math.min(remainingAmount, debt);
      
      // Creamos el registro de pago
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

      // Evaluamos si ya se pagó completo
      const newPaid = alreadyPaid + paymentToApply;
      // Tolerancia de 1 centavo
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
      remainingChange: remainingAmount, // Si sobra dinero a favor
      payments: paymentsCreated
    };
  }
}
