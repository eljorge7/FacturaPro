import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionRequestsService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyRequests(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        tier: string;
        amount: number;
        reference: string;
        isAnnual: boolean;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createSimulation(tenantId: string, payload: {
        tier: string;
        amount: number;
        isAnnual: boolean;
        paymentMethodId: string;
    }): Promise<{
        id: string;
        tenantId: string;
        tier: string;
        amount: number;
        reference: string;
        isAnnual: boolean;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
