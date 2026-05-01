import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.payrollService.findAll(tenantId);
  }

  @Post()
  createDraft(@Headers('x-tenant-id') tenantId: string, @Body() data: { periodStart: string, periodEnd: string }) {
    return this.payrollService.createDraft(tenantId, data.periodStart, data.periodEnd);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.payrollService.findOne(tenantId, id);
  }

  @Delete(':id')
  unrollDraft(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.payrollService.unrollDraft(tenantId, id);
  }

  @Patch(':id/payslips/:payslipId')
  updatePayslip(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('payslipId') payslipId: string,
    @Body() data: any
  ) {
    return this.payrollService.updatePayslip(tenantId, id, payslipId, data);
  }

  @Post(':id/execute')
  executePayRun(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.payrollService.executePayRun(tenantId, id);
  }
}
