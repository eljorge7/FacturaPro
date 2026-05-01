import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BankTransactionsService } from './bank-transactions.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard'; 
import { VisionReconciliationService } from './vision-reconciliation.service';

@Controller('bank-transactions')
@UseGuards(HybridAuthGuard)
export class BankTransactionsController {
  constructor(
    private readonly bankTransactionsService: BankTransactionsService,
    private readonly visionService: VisionReconciliationService
  ) {}

  @Get('account/:accountId')
  findAll(@Req() req: any, @Param('accountId') bankAccountId: string) {
    return this.bankTransactionsService.findAllByAccount(req.user.tenantId, bankAccountId);
  }

  @Post('account/:accountId/batch')
  createBatch(@Req() req: any, @Param('accountId') bankAccountId: string, @Body() data: any[]) {
    return this.bankTransactionsService.createBatch(req.user.tenantId, bankAccountId, data);
  }

  @Get(':id/suggestions')
  getSuggestions(@Req() req: any, @Param('id') txId: string) {
    return this.bankTransactionsService.getSuggestions(req.user.tenantId, txId);
  }

  @Post(':id/reconcile/invoice/:invoiceId')
  reconcileInvoice(
    @Request() req: any,
    @Param('id') transactionId: string,
    @Param('invoiceId') invoiceId: string
  ) {
    return this.bankTransactionsService.reconcileInvoice(req.user.tenantId, transactionId, invoiceId);
  }

  @Put(':id/move/:targetBankAccountId')
  moveTransaction(
    @Request() req: any,
    @Param('id') transactionId: string,
    @Param('targetBankAccountId') targetBankAccountId: string
  ) {
    return this.bankTransactionsService.moveTransaction(req.user.tenantId, transactionId, targetBankAccountId);
  }

  @Delete(':id')
  deleteTransaction(
    @Request() req: any,
    @Param('id') transactionId: string
  ) {
    return this.bankTransactionsService.deleteTransaction(req.user.tenantId, transactionId);
  }

  @Post('account/:accountId/process-receipt-vision')
  @UseInterceptors(FileInterceptor('receipt'))
  async processReceiptVision(
     @Request() req: any,
     @Param('accountId') accountId: string,
     @UploadedFile() file: Express.Multer.File
  ) {
      if (!file) {
         throw new BadRequestException('Por favor adjunte la imagen del comprobante.');
      }
      // Ensure it's an image
      if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
         throw new BadRequestException('Formato inválido. Solo PNG, JPEG o PDF.');
      }
      return this.visionService.processReceipt(req.user.tenantId, accountId, file);
  }
}
