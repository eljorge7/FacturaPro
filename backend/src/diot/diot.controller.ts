import { Controller, Get, Headers, BadRequestException } from '@nestjs/common';
import { DiotService } from './diot.service';

@Controller('diot')
export class DiotController {
  constructor(private readonly diotService: DiotService) {}

  @Get('summary')
  getSummary(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.diotService.getSummary(tenantId);
  }
}
