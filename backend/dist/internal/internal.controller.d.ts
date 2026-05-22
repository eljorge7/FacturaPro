import { PrismaService } from '../prisma/prisma.service';
export declare class InternalController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    syncTenant(apiKey: string, body: {
        tenantId: string;
        subscriptionTier: string;
        stamps: number;
        hasExpenseControl: boolean;
        hasApiAccess: boolean;
    }): Promise<{
        id: string;
        name: string;
        tradeName: string | null;
        phone: string | null;
        domain: string | null;
        subscriptionTier: string;
        availableStamps: number;
        subscriptionEndsAt: Date | null;
        hasExpenseControl: boolean;
        hasApiAccess: boolean;
        hasPosAccess: boolean;
        hasInventoryControl: boolean;
        storeEnabled: boolean;
        storeSlug: string | null;
        storeCustomDomain: string | null;
        syscomClientId: string | null;
        syscomClientSecret: string | null;
        mercadopagoAccessToken: string | null;
        agencyId: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        success: boolean;
    }>;
}
