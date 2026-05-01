import { Controller, Get, Post, Body, Patch, Param, Headers } from '@nestjs/common';
import { StockTakesService } from './stock-takes.service';

@Controller('stock-takes')
export class StockTakesController {
  constructor(private readonly stockTakesService: StockTakesService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.stockTakesService.create(tenantId, data);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.stockTakesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.stockTakesService.findOne(tenantId, id);
  }

  @Patch(':id/submit')
  submitCounts(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: { counts: any[] }) {
    return this.stockTakesService.submitCounts(tenantId, id, body.counts);
  }

  @Patch(':id/apply')
  applyAdjustments(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.stockTakesService.applyAdjustments(tenantId, id);
  }
}
