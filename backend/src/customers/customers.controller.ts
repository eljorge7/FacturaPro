import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Post('bulk')
  createBulk(@Body() body: { tenantId: string, customers: any[] }) {
    if (!body.tenantId || !body.customers) return { error: 'Missing data' };
    return this.customersService.createBulk(body.tenantId, body.customers);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.customersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  // --- MÓDULO DE FIADO ---

  @Get(':id/credit')
  getCreditStatement(@Param('id') id: string) {
    return this.customersService.getCreditStatement(id);
  }

  @Patch(':id/credit-config')
  updateCreditConfig(
    @Param('id') id: string,
    @Body() body: { creditEnabled: boolean; creditLimit: number; creditDays: number; creditStatus: string }
  ) {
    return this.customersService.updateCreditConfig(id, body.creditEnabled, body.creditLimit, body.creditDays, body.creditStatus);
  }

  @Post(':id/credit-payment')
  registerCreditPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod: string; notes?: string }
  ) {
    return this.customersService.registerCreditPayment(id, body.amount, body.paymentMethod, body.notes);
  }
}
