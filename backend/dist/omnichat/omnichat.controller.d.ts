import { PrismaService } from '../prisma/prisma.service';
export declare class OmniChatProxyController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private validateToken;
    identifyCustomer(phone: string, token: string): Promise<{
        found: boolean;
        customerId?: undefined;
        name?: undefined;
        facturaproContext?: undefined;
    } | {
        found: boolean;
        customerId: string;
        name: string;
        facturaproContext: string;
    }>;
    generateDraftInvoice(body: any, token: string): Promise<{
        success: boolean;
        message: string;
        invoiceNumber?: undefined;
    } | {
        success: boolean;
        invoiceNumber: string;
        message: string;
    }>;
}
