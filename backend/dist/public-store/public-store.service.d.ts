import { PrismaService } from '../prisma/prisma.service';
export declare class PublicStoreService {
    private prisma;
    private readonly logger;
    private syscomTokens;
    private productsCache;
    constructor(prisma: PrismaService);
    private getSyscomToken;
    getCombinedCatalog(slug: string, page?: number): Promise<{
        products: any[];
        page: number;
    }>;
    getProductDetails(slug: string, id: string): Promise<any>;
    createOrder(slug: string, data: any): Promise<{
        order: {
            tenant: {
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
            };
            items: {
                id: string;
                orderId: string;
                productId: string | null;
                syscomId: string | null;
                title: string;
                price: number;
                quantity: number;
                satKey: string | null;
            }[];
        } & {
            id: string;
            tenantId: string;
            customerId: string | null;
            customerName: string;
            customerPhone: string;
            customerAddress: string;
            totalAmount: number;
            status: string;
            isFacturado: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        checkoutUrl: string;
    } | {
        order: {
            tenant: {
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
            };
            items: {
                id: string;
                orderId: string;
                productId: string | null;
                syscomId: string | null;
                title: string;
                price: number;
                quantity: number;
                satKey: string | null;
            }[];
        } & {
            id: string;
            tenantId: string;
            customerId: string | null;
            customerName: string;
            customerPhone: string;
            customerAddress: string;
            totalAmount: number;
            status: string;
            isFacturado: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        checkoutUrl: null;
    }>;
    generatePaymentLink(slug: string, id: string): Promise<{
        checkoutUrl: string;
    }>;
    private createPreference;
}
