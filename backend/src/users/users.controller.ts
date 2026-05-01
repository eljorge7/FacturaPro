import { Controller, Get, Post, Body, Param, Delete, Headers, Patch } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.usersService.create(tenantId, data);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.usersService.update(tenantId, id, data);
  }
}
