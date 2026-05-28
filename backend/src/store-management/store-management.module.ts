import { Module } from '@nestjs/common';
import { StoreManagementService } from './store-management.service';
import { StoreManagementController } from './store-management.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SyscomDropshipService } from './syscom-dropship.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoreManagementController],
  providers: [StoreManagementService, SyscomDropshipService],
})
export class StoreManagementModule {}
