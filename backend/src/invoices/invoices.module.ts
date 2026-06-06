import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PortalController } from './portal.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CfdiModule } from '../cfdi/cfdi.module';
import { TopupsModule } from '../topups/topups.module';

@Module({
  imports: [PrismaModule, AuthModule, CfdiModule, TopupsModule],
  controllers: [InvoicesController, PortalController],
  providers: [InvoicesService, PdfService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
