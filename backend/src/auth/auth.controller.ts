import { Controller, Post, Body, Patch, Param, Headers, UnauthorizedException, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Get('profile')
  async getProfile(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.getProfile(decoded.userId);
  }

  @Patch('profile')
  async updateProfile(@Headers('Authorization') auth: string, @Body() body: any) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.updateProfile(decoded.userId, body);
  }

  @Post('request-otp')
  requestOtp(@Body() body: any) {
    return this.authService.requestOtp(body);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: any) {
    return this.authService.verifyOtp(body);
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body);
    if (result && result.token) {
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutos
      });
    }
    return result;
  }

  @Post('sso')
  async sso(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.sso(body);
    if (result && result.token) {
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });
    }
    return result;
  }

  // === MULTI-TENANT SWITCH (AGENCY) ===

  @Get('memberships')
  async getMemberships(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.getMemberships(decoded.userId);
  }

  @Get('agency/team')
  async getAgencyTeam(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.getAgencyTeam(decoded.userId);
  }

  @Post('switch-tenant')
  async switchTenant(@Headers('Authorization') auth: string, @Body() body: { targetTenantId: string }) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.switchTenant(decoded.userId, body.targetTenantId);
  }

  @Post('agency/team/invite')
  async inviteAgencyMember(@Headers('Authorization') auth: string, @Body() body: { email: string, role: string, name: string }) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.inviteAgencyMember(decoded.userId, body.email, body.role, body.name);
  }

  @Post('agency/team/:targetUserId/assign-tenants')
  async assignTenantsToStaff(
    @Headers('Authorization') auth: string, 
    @Param('targetUserId') targetUserId: string, 
    @Body() body: { tenantIds: string[] }
  ) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();

    return this.authService.assignWorkspaceTenants(decoded.userId, targetUserId, body.tenantIds);
  }

  // === AGENCY EXECUTIVE METRICS ===
  @Get('agency/metrics')
  async getAgencyMetrics(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.authService.getAgencyMetrics(decoded.userId);
  }

  @Post('agency/auto-bill')
  async generateAutoBills(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.authService.generateAutoBills(decoded.userId);
  }

  // === AGENCY TASKS ===
  @Get('agency/tasks')
  async getAgencyTasks(@Headers('Authorization') auth: string) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.authService.getAgencyTasks(decoded.userId);
  }

  @Post('agency/tasks')
  async createAgencyTask(@Headers('Authorization') auth: string, @Body() body: any) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.authService.createAgencyTask(decoded.userId, body);
  }

  @Patch('agency/tasks/:taskId')
  async updateAgencyTask(
    @Headers('Authorization') auth: string, 
    @Param('taskId') taskId: string, 
    @Body() body: any
  ) {
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) throw new UnauthorizedException();
    return this.authService.updateAgencyTask(decoded.userId, taskId, body);
  }
}
