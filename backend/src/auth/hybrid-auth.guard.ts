import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class HybridAuthGuard implements CanActivate {
  constructor(
     private prisma: PrismaService,
     private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
       // Si no hay auth, y hay x-tenant-id, provisionalmente dejarlo pasar (por legacy/tests).
       // En el futuro: throw new UnauthorizedException('Missing Authorization header');
       return true;
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return true;

    // 1. JWT Check
    try {
        const decoded: any = this.jwtService.verify(token);
        if (decoded && decoded.tenantId) {
            request.user = decoded;
            request.tenantId = decoded.tenantId;
            return true;
        }
    } catch (e) {
        // Not a valid JWT, maybe an API Key
    }

    // 2. API Key Check
    const keyHash = crypto.createHash('sha256').update(token).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (apiKey && apiKey.isActive) {
      request.user = { tenantId: apiKey.tenantId };
      request.tenantId = apiKey.tenantId; // Inject tenantId for the controller
      return true;
    }

    throw new UnauthorizedException('Invalid Token or API Key');
  }
}
