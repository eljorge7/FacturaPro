import { Controller, Get, Post, Body, Param, Headers, Patch, Delete } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';

@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() data: any) {
    return this.timeEntriesService.create(tenantId, data);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.timeEntriesService.findAll(tenantId);
  }
  
  @Get('project/:projectId')
  findByProject(@Headers('x-tenant-id') tenantId: string, @Param('projectId') projectId: string) {
    return this.timeEntriesService.findByProject(tenantId, projectId);
  }

  @Patch(':id')
  update(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.timeEntriesService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.timeEntriesService.remove(tenantId, id);
  }
}
