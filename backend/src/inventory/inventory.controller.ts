import { Controller, Get, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('movements')
  async getAllMovements(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.inventoryService.getAllMovements(tenantId);
  }

  @Post('quick-receive')
  async quickReceive(@Req() req: any, @Body() payload: { productId: string, quantity: number, reference: string, batchNumber?: string, expiryDate?: string }[]) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.inventoryService.quickReceive(tenantId, payload);
  }
}
