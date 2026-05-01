import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuoteDto: CreateQuoteDto) {
    let { tenantId, customerId, items, notes, expirationDate, taxIncluded } = createQuoteDto;

    // 1. Resolver Tenant
    if (!tenantId) {
      const tenantFallback = await this.prisma.tenant.findFirst();
      if (!tenantFallback) throw new BadRequestException('El sistema no tiene Empresa configurada.');
      tenantId = tenantFallback.id;
    }

    let taxProfile = await this.prisma.taxProfile.findFirst({ where: { tenantId } });
    if (!taxProfile) {
       taxProfile = await this.prisma.taxProfile.create({
          data: { tenantId, rfc: 'XAXX010101000', legalName: 'Mi Empresa', taxRegime: '601', zipCode: '00000' }
       });
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    let subtotal = 0;
    let taxTotal = 0;
    
    const quoteItemsData = items.map(item => {
      const discount = item.discount || 0;
      let lineTotal = 0;
      let lineSubtotal = 0;
      let lineTaxes = 0;

      if (taxIncluded) {
         // Precio unitario YA tiene IVA
         lineTotal = (item.quantity * item.unitPrice) - discount;
         lineSubtotal = lineTotal / (1 + item.taxRate);
         lineTaxes = lineTotal - lineSubtotal;
      } else {
         // Precio unitario MÁS IVA
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
    
    let quoteNumber = (createQuoteDto as any).quoteNumber;
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
        } else {
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

  async findAll(tenantId: string) {
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

  async findOne(id: string) {
    const q = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true, customer: true, taxProfile: true }
    });
    if (!q) throw new NotFoundException('Cotización no encontrada');
    return q;
  }

  async updateStatus(id: string, updateQuoteDto: UpdateQuoteDto) {
    return this.prisma.quote.update({
      where: { id },
      data: { status: updateQuoteDto.status }
    });
  }

  remove(id: string) {
    return this.prisma.quote.delete({ where: { id } });
  }
}
