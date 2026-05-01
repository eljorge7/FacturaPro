import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';

@Controller('bank-accounts')
@UseGuards(HybridAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.bankAccountsService.findAll(req.user.tenantId);
  }

  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.bankAccountsService.create(req.user.tenantId, data);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.bankAccountsService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.bankAccountsService.update(req.user.tenantId, id, data);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.bankAccountsService.remove(req.user.tenantId, id);
  }
}
