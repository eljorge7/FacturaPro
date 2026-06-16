import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.expenseCategoriesService.findAll(tenantId);
  }

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: { name: string; color?: string }) {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.expenseCategoriesService.create(tenantId, data);
  }
}
