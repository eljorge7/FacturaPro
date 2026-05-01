import { Controller, Get, Post, Body, Patch, Param, Headers } from '@nestjs/common';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.transfersService.create(tenantId, data);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.transfersService.findAll(tenantId);
  }

  @Patch(':id/receive')
  receive(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.transfersService.receive(tenantId, id, body.itemsRecv);
  }

  @Patch(':id/resolve-discrepancy')
  resolveDiscrepancy(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: { action: 'MERMA' | 'RETURN_TO_ORIGIN' }) {
    return this.transfersService.resolveDiscrepancy(tenantId, id, body.action);
  }
}
