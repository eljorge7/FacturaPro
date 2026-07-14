import { PrismaService } from '../prisma/prisma.service';
export declare class TopupsService {
    private prisma;
    constructor(prisma: PrismaService);
    processTopup(tenantId: string, type: string, carrier: string, amount: number, reference: string, invoiceId?: string): Promise<{
        success: boolean;
        folio: any;
        transactionId: string;
    }>;
    private mockProviderCall;
}
