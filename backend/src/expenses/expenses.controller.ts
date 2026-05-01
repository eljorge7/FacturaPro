import { Controller, Get, Post, Delete, Param, Body, Headers, BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.expensesService.findAll(tenantId);
  }

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.expensesService.create(tenantId, data);
  }

  @Post('preview-xml')
  async previewXml(@Headers('x-tenant-id') tenantId: string, @Body() body: { xmlContent: string }) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    if (!body.xmlContent) throw new BadRequestException('XML Content is required');
    return this.expensesService.parseXml(tenantId, body.xmlContent);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
