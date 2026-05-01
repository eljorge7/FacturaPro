import { Controller, Get, Post, Delete, Patch, Body, Req, UnauthorizedException, Param } from '@nestjs/common';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async getAllPurchases(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.getAllPurchases(tenantId);
  }

  @Get('ap-report')
  async getApReport(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.getApReport(tenantId);
  }

  @Post()
  async createPurchase(@Req() req: any, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.createPurchase(tenantId, payload);
  }

  @Delete(':id')
  async deletePurchase(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.deletePurchase(tenantId, id);
  }

  @Patch(':id')
  async updatePurchase(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.updatePurchase(tenantId, id, payload);
  }

  @Post(':id/receive')
  async receivePurchase(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.receivePurchase(tenantId, id, payload.items); 
  }

  @Post(':id/payment')
  async addPayment(@Req() req: any, @Param('id') id: string, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.purchasesService.addPayment(tenantId, id, payload);
  }
}
