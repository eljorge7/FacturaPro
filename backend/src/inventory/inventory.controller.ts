import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('movements')
  async getAllMovements(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.inventoryService.getAllMovements(tenantId);
  }
}
