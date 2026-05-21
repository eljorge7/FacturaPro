import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PdfService } from '../invoices/pdf.service';

@Controller('quotes')
export class QuotesController {
  constructor(
     private readonly quotesService: QuotesService,
     private readonly pdfService: PdfService
  ) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.quotesService.findAll(tenantId);
  }

  @Get('stats/dashboard')
  getDashboardStats(@Headers('x-tenant-id') tenantId: string) {
    // Si tenantId es 'demo-tenant', mandaremos el tenantFallback. (Manejado en service por conveniencia)
    return this.quotesService.getDashboardStats(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: any) {
    const quote = await this.quotesService.findOne(id);
    const pdfBuffer = await this.pdfService.generateQuotePdf(quote);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion_${quote.quoteNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Post(':id/send')
  async sendQuote(@Param('id') id: string) {
    return this.quotesService.sendQuote(id);
  }

  @Post(':id/convert-to-invoice')
  async convertToInvoice(@Param('id') id: string) {
    return this.quotesService.convertToInvoice(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/quotes',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadAttachment(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No se recibió archivo');
    return this.quotesService.addAttachment(id, file);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.updateStatus(id, updateQuoteDto);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() updateData: any) {
    return this.quotesService.update(tenantId, id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }
}
