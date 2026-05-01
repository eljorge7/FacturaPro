import { Module } from '@nestjs/common';
import { SubscriptionRequestsService } from './subscription-requests.service';
import { SubscriptionRequestsController } from './subscription-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [SubscriptionRequestsService],
  controllers: [SubscriptionRequestsController]
})
export class SubscriptionRequestsModule {}
