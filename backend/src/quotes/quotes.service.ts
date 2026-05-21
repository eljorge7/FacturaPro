import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  async create(createQuoteDto: CreateQuoteDto | any) {
    let { tenantId, customerId, items, notes, expirationDate, taxIncluded, 
        isProposal, projectName, projectScope, projectNotes, coordinates, personnel, materials, coverImageUrl, templateId 
    } = createQuoteDto;

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
    
    const quoteItemsData = items.map((item: any) => {
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

    const tdsTotal = customer.tdsEnabled ? (subtotal * 0.0125) : 0;
    const total = subtotal + taxTotal - tdsTotal;
    
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
        tdsTotal,
        total,
        notes,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        isProposal: isProposal || false,
        projectName,
        projectScope,
        projectNotes,
        coordinates,
        personnel,
        materials,
        coverImageUrl,
        templateId,
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
      include: { customer: true, items: true, taxProfile: true, attachments: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const q = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true, customer: true, taxProfile: true, attachments: true }
    });
    if (!q) throw new NotFoundException('Cotización no encontrada');
    return q;
  }

  async sendQuote(id: string) {
    const quote = await this.findOne(id);
    if (!quote.customer?.email) {
      throw new BadRequestException('El cliente no tiene un correo electrónico registrado.');
    }

    const proposalUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3004'}/quotes/${quote.id}/proposal`;
    
    await this.mailService.sendQuoteEmail(
      quote.customer.email,
      quote.quoteNumber,
      proposalUrl,
      quote.customer.legalName
    );

    return this.prisma.quote.update({
      where: { id },
      data: { status: 'SENT' }
    });
  }

  async updateStatus(id: string, updateQuoteDto: UpdateQuoteDto) {
    return this.prisma.quote.update({
      where: { id },
      data: { status: updateQuoteDto.status }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.quote.update({
      where: { id },
      data: {
        isProposal: data.isProposal !== undefined ? data.isProposal : undefined,
        projectName: data.projectName !== undefined ? data.projectName : undefined,
        projectScope: data.projectScope !== undefined ? data.projectScope : undefined,
        projectNotes: data.projectNotes !== undefined ? data.projectNotes : undefined,
        coordinates: data.coordinates !== undefined ? data.coordinates : undefined,
        personnel: data.personnel !== undefined ? data.personnel : undefined,
        materials: data.materials !== undefined ? data.materials : undefined,
        coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : undefined,
        templateId: data.templateId !== undefined ? data.templateId : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        expirationDate: data.expirationDate !== undefined ? (data.expirationDate ? new Date(data.expirationDate) : null) : undefined,
      }
    });
  }

  remove(id: string) {
    return this.prisma.quote.delete({ where: { id } });
  }

  async addAttachment(id: string, file: Express.Multer.File) {
    // Aquí el archivo ya fue guardado en el disco por Multer en ./uploads/quotes
    const fileUrl = `/uploads/quotes/${file.filename}`;
    
    return this.prisma.quoteAttachment.create({
      data: {
        quoteId: id,
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileSize: file.size,
      }
    });
  }

  async convertToInvoice(id: string) {
    const quote = await this.findOne(id);
    if (quote.status === 'INVOICED') throw new BadRequestException('Esta cotización ya fue facturada.');

    // Crear la Factura (Invoice) copiando los datos
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: quote.tenantId,
        taxProfileId: quote.taxProfileId,
        customerId: quote.customerId,
        quoteId: quote.id,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        tdsTotal: quote.tdsTotal,
        total: quote.total,
        currency: quote.currency,
      }
    });

    // Copiar las partidas (QuoteItem -> InvoiceItem)
    const invoiceItems = quote.items.map(item => ({
      invoiceId: invoice.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      total: item.total
    }));

    await this.prisma.invoiceItem.createMany({ data: invoiceItems });

    // Actualizar estado de cotización
    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'INVOICED' }
    });

    return invoice;
  }

  async getDashboardStats(tenantId: string) {
    const quotes = await this.prisma.quote.findMany({
      where: { tenantId }
    });

    let totalSent = 0;
    let totalWon = 0;
    let countSent = 0;
    let countWon = 0;

    quotes.forEach(q => {
      // Consideramos "Enviadas" todas las que no sean borrador o rechazadas
      if (q.status !== 'DRAFT') {
        totalSent += q.total;
        countSent++;
      }
      if (q.status === 'ACCEPTED' || q.status === 'INVOICED') {
        totalWon += q.total;
        countWon++;
      }
    });

    const conversionRate = countSent > 0 ? Math.round((countWon / countSent) * 100) : 0;

    return {
      totalSent,
      totalWon,
      conversionRate,
      countSent,
      countWon
    };
  }
}
