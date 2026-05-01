import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(tenantId, createWarehouseDto);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.warehousesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.warehousesService.findOne(tenantId, id);
  }

  @Patch(':id/default')
  setAsDefault(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.warehousesService.setAsDefault(tenantId, id);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: { name: string, address?: string }) {
    return this.warehousesService.update(tenantId, id, body.name, body.address);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.warehousesService.remove(tenantId, id);
  }
}
