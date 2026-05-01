import { Controller, Get, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PosService } from './pos.service';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('checkout')
  async checkout(@Body() payload: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.posService.checkout(tenantId, payload);
  }

  @Post('shifts/current')
  async getCurrentShift(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.posService.getCurrentShift(tenantId);
  }

  @Post('shifts/open')
  async openShift(@Body() payload: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.posService.openShift(tenantId, payload);
  }

  @Get('shifts/:id/summary')
  async getShiftSummary(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.posService.getShiftSummary(tenantId, req.params.id);
  }

  @Post('shifts/:id/close')
  async closeShift(@Req() req: any, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    // we pass payload.userId to close it
    return this.posService.closeShift(tenantId, req.params.id, payload.userId);
  }

  @Post('shifts/:id/movements')
  async addMovement(@Req() req: any, @Body() payload: any) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) throw new UnauthorizedException('TenantID missing');
    return this.posService.addMovement(tenantId, req.params.id, payload);
  }
}
