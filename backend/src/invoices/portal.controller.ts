import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';

@Controller('portal')
export class PortalController {
  constructor(
     private readonly invoicesService: InvoicesService,
     private readonly pdfService: PdfService
  ) {}

  @Get('invoices/:id')
  async getPublicInvoice(@Param('id') id: string) {
    try {
      // Magic Link route (No Auth Guard)
      const invoice = await this.invoicesService.findOne(id);
      
      // Sanitizamos el payload público
      return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.date,
          status: invoice.status,
          total: invoice.total,
          subtotal: invoice.subtotal,
          taxTotal: invoice.taxTotal,
          currency: invoice.currency,
          satUuid: invoice.satUuid,
          paymentForm: invoice.paymentForm,
          paymentMethod: invoice.paymentMethod,
          cfdiUse: invoice.cfdiUse,
          createdAt: invoice.createdAt,
          customer: {
             legalName: invoice.customer?.legalName,
             rfc: invoice.customer?.rfc,
             zipCode: invoice.customer?.zipCode,
             email: invoice.customer?.email,
          },
          items: invoice.items.map(i => ({
             description: i.description,
             quantity: i.quantity,
             unitPrice: i.unitPrice,
             total: i.total
          })),
          payments: invoice.payments?.map(p => ({
             id: p.id,
             amount: p.amount,
             paymentDate: p.paymentDate,
             paymentMethod: p.paymentMethod,
             reference: p.reference
          })),
          taxProfile: {
             legalName: invoice.taxProfile?.legalName,
             rfc: invoice.taxProfile?.rfc,
             logoUrl: invoice.taxProfile?.logoUrl,
             brandColor: invoice.taxProfile?.brandColor,
             brandFont: invoice.taxProfile?.brandFont,
             pdfTemplate: invoice.taxProfile?.pdfTemplate
          }
      };
    } catch(e) {
      throw new NotFoundException('Documento no encontrado o no disponible');
    }
  }

  @Get('invoices/:id/pdf')
  async downloadPublicPdf(@Param('id') id: string, @Res() res: any) {
    try {
      const invoice = await this.invoicesService.findOne(id);
      const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura_${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.end(pdfBuffer);
    } catch(e) {
       res.status(404).send('Documento no encontrado');
    }
  }

  @Get('invoices/:id/xml')
  async downloadPublicXml(@Param('id') id: string, @Res() res: any) {
    try {
      const invoice = await this.invoicesService.findOne(id);
      if (!invoice.xmlContent) {
         return res.status(404).send('XML no disponible para esta factura');
      }
      
      res.set({
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="factura_${invoice.invoiceNumber}.xml"`,
      });
      
      res.send(invoice.xmlContent);
    } catch(e) {
       res.status(404).send('Documento no encontrado');
    }
  }
}
