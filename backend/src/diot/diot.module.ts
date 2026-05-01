import { Module } from '@nestjs/common';
import { DiotService } from './diot.service';
import { DiotController } from './diot.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiotController],
  providers: [DiotService],
})
export class DiotModule {}
