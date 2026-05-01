import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class HybridAuthGuard implements CanActivate {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
