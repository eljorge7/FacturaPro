import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
        throw new UnauthorizedException('Invalid token format');
    }

    // Hash the token and look it up
    const keyHash = crypto.createHash('sha256').update(token).digest('hex');

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey || !apiKey.isActive) {
      // It might be a JWT token, let the JwtAuthGuard handle it if used in combination
      // But if we specifically use ApiKeyGuard, it MUST fail if invalid.
      throw new UnauthorizedException('Invalid or inactive API Key');
    }

    request.tenantId = apiKey.tenantId; // Inject tenantId for the controller
    return true;
  }
}
