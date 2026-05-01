import { Controller, Get, Headers } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.expenseCategoriesService.findAll(tenantId);
  }
}
