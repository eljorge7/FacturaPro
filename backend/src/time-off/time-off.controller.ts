import { Controller, Get, Post, Body, Patch, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TimeOffService } from './time-off.service';

@Controller('time-off')
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Post()
  async createRequest(@Req() req: any, @Body() data: any) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User ID not found in request');
    
    // We need to pass the employeeId. The easiest way is for the frontend to pass it, 
    // or we resolve it here. Let's allow frontend to pass it, or we look it up.
    // For safety, let's assume the frontend passes `employeeId` in the body.
    if (!data.employeeId) throw new UnauthorizedException('Employee ID is required');

    return this.timeOffService.createRequest(tenantId, data.employeeId, data);
  }

  @Get('my-requests')
  getMyRequests(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    // Assuming the frontend passes employeeId as a query param or we look it up.
    // Let's use a query param `?employeeId=xxx`
    const employeeId = req.query.employeeId as string;
    if (!employeeId) throw new UnauthorizedException('Employee ID is required');
    return this.timeOffService.getMyRequests(tenantId, employeeId);
  }

  @Get()
  getAllRequests(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    return this.timeOffService.getAllRequests(tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() body: { status: string, adminNotes?: string, deductedDays?: number }
  ) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    return this.timeOffService.updateStatus(tenantId, id, body.status, body.adminNotes, body.deductedDays);
  }
}
