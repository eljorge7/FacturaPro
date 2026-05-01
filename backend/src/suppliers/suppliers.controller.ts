import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
     if (!tenantId) throw new BadRequestException('Tenant ID is required');
     return this.suppliersService.create(tenantId, data);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
     if (!tenantId) throw new BadRequestException('Tenant ID is required');
     return this.suppliersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.suppliersService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.suppliersService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.suppliersService.remove(tenantId, id);
  }
}
