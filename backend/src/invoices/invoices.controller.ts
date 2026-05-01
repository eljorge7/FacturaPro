import { Controller, Get, Post, Body, Patch, Param, Res, Headers, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PdfService } from './pdf.service';

@Controller('invoices')
@UseGuards(HybridAuthGuard)
export class InvoicesController {
  constructor(
     private readonly invoicesService: InvoicesService,
     private readonly pdfService: PdfService
  ) {}

  @Post()
  create(@Req() req: any, @Body() createInvoiceDto: CreateInvoiceDto, @Headers('x-tenant-id') hTenantId: string) {
    const finalTenantId = req.tenantId || hTenantId;
    if (finalTenantId) {
        createInvoiceDto.tenantId = finalTenantId;
    }
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Req() req: any, @Headers('x-tenant-id') hTenantId: string) {
    const finalTenantId = req.tenantId || hTenantId;
    return this.invoicesService.findAll(finalTenantId);
  }

  @Get('stats')
  getStats(@Req() req: any, @Headers('x-tenant-id') hTenantId: string) {
    const finalTenantId = req.tenantId || hTenantId;
    return this.invoicesService.getStats(finalTenantId);
  }

  @Get('ar-report')
  getArReport(@Req() req: any, @Headers('x-tenant-id') hTenantId: string) {
    const finalTenantId = req.tenantId || hTenantId;
    return this.invoicesService.getArReport(finalTenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: any) {
    const invoice = await this.invoicesService.findOne(id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura_${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Post(':id/cancel')
  cancelFiscal(
    @Param('id') id: string,
    @Body() body: { motive: string; substitutionUuid?: string }
  ) {
    return this.invoicesService.cancelFiscal(id, body.motive, body.substitutionUuid);
  }

  @Post(':id/payments')
  async registerPayment(
    @Param('id') id: string, 
    @Body() payload: { amount: number; paymentDate: string; paymentMethod: string; reference?: string; notes?: string }
  ) {
     return this.invoicesService.registerPayment(id, payload);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  @Patch(':id/stamp')
  stamp(@Param('id') id: string) {
    return this.invoicesService.stamp(id);
  }

  @Post(':id/send-whatsapp')
  sendWhatsapp(@Param('id') id: string, @Body() payload: { phone: string }) {
    if (!payload.phone) throw new BadRequestException('El número de WhatsApp es obligatorio.');
    return this.invoicesService.sendWhatsapp(id, payload.phone);
  }
}
