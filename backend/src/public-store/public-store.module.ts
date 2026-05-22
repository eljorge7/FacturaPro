import { Module } from '@nestjs/common';
import { PublicStoreService } from './public-store.service';
import { PublicStoreController } from './public-store.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicStoreController],
  providers: [PublicStoreService],
})
export class PublicStoreModule {}
