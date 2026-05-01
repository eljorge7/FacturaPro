import { Module } from '@nestjs/common';
import { BankTransactionsController } from './bank-transactions.controller';
import { BankTransactionsService } from './bank-transactions.service';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { VisionReconciliationService } from './vision-reconciliation.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService, VisionReconciliationService]
})
export class BankTransactionsModule {}
