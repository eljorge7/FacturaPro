import { PrismaService } from '../prisma/prisma.service';
export declare class StoreCronService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleAbandonedCarts(): Promise<void>;
}
