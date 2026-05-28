import { PrismaService } from '../prisma/prisma.service';
export declare class SyscomDropshipService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processOrder(tenantId: string, orderId: string): Promise<void>;
    private handlePendingGrouping;
    private handleDropshipping;
}
