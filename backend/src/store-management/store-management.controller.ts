import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { StoreManagementService } from './store-management.service';

@Controller('store-management')
export class StoreManagementController {
  constructor(private readonly service: StoreManagementService) {}

  @Get('settings')
  async getSettings(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getSettings(tenantId);
  }

  @Patch('settings')
  async updateSettings(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.service.updateSettings(tenantId, data);
  }

  @Get('products')
  async getProducts(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getProducts(tenantId);
  }

  @Post('products')
  async createProduct(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.service.createProduct(tenantId, data);
  }

  @Put('products/:id')
  async updateProduct(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.service.updateProduct(tenantId, id, data);
  }

  @Delete('products/:id')
  async deleteProduct(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.deleteProduct(tenantId, id);
  }

  @Get('orders')
  async getOrders(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getOrders(tenantId);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.service.updateOrderStatus(tenantId, id, status);
  }
}
