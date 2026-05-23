import { PublicStoreService } from './public-store.service';
import { JwtService } from '@nestjs/jwt';
export declare class PublicStoreController {
    private readonly storeService;
    private readonly jwtService;
    constructor(storeService: PublicStoreService, jwtService: JwtService);
    register(slug: string, data: any): Promise<{
        success: boolean;
        userId: string;
    }>;
    getMyOrders(slug: string, auth: string): Promise<({
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
        street: string | null;
        exteriorNum: string | null;
        neighborhood: string | null;
        zipCode: string | null;
        city: string | null;
        state: string | null;
        references: string | null;
        billingRfc: string | null;
        billingName: string | null;
        totalAmount: number;
        status: string;
        isFacturado: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    testSyscom(): Promise<{
        error: string;
        details?: undefined;
        client_id?: undefined;
        success?: undefined;
        token?: undefined;
        productsCount?: undefined;
    } | {
        error: string;
        details: any;
        client_id: string | null;
        success?: undefined;
        token?: undefined;
        productsCount?: undefined;
    } | {
        success: boolean;
        token: string;
        productsCount: any;
        error?: undefined;
        details?: undefined;
        client_id?: undefined;
    } | {
        error: string;
        details: any;
        client_id?: undefined;
        success?: undefined;
        token?: undefined;
        productsCount?: undefined;
    }>;
    getCatalog(slug: string, search: string, page: string): Promise<{
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
                hasStoreAccess: boolean;
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
            street: string | null;
            exteriorNum: string | null;
            neighborhood: string | null;
            zipCode: string | null;
            city: string | null;
            state: string | null;
            references: string | null;
            billingRfc: string | null;
            billingName: string | null;
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
                hasStoreAccess: boolean;
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
            street: string | null;
            exteriorNum: string | null;
            neighborhood: string | null;
            zipCode: string | null;
            city: string | null;
            state: string | null;
            references: string | null;
            billingRfc: string | null;
            billingName: string | null;
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
}
