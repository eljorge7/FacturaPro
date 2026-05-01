import { Controller, Get, Post, Body, Param, Delete, Headers, Patch } from '@nestjs/common';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: { name: string, description?: string }) {
    return this.departmentsService.create(tenantId, body.name, body.description);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.departmentsService.findAll(tenantId);
  }

  @Get('payroll-stats')
  getPayrollStats(@Headers('x-tenant-id') tenantId: string) {
    return this.departmentsService.getPayrollStats(tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Headers('x-tenant-id') tenantId: string, 
    @Body() body: { name: string }
  ) {
    return this.departmentsService.update(id, tenantId, body.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.departmentsService.remove(id, tenantId);
  }
}
