import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionRequestsService } from './subscription-requests.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';

@Controller('subscription-requests')
@UseGuards(HybridAuthGuard)
export class SubscriptionRequestsController {
  constructor(private readonly subscriptionRequestsService: SubscriptionRequestsService) {}

  @Get('mine')
  getMyRequests(@Request() req: any) {
    return this.subscriptionRequestsService.getMyRequests(req.user.tenantId);
  }

  @Post('checkout')
  createCheckoutSession(@Request() req: any, @Body() body: any) {
    return this.subscriptionRequestsService.createSimulation(req.user.tenantId, body);
  }
}
