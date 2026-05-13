import { PrismaService } from '../prisma/prisma.service';
import { BankTransactionsService } from './bank-transactions.service';
import { ConfigService } from '@nestjs/config';
export declare class VisionReconciliationService {
    private prisma;
    private bankTxService;
    private configService;
    private openai;
    private readonly logger;
    constructor(prisma: PrismaService, bankTxService: BankTransactionsService, configService: ConfigService);
    processReceipt(tenantId: string, bankAccountId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        extracted: any;
        transactionId: string;
        reconciliationStatus: string;
        targetAccountId: string;
        rerouted: boolean;
        targetAccountName: string;
        matchedInvoice: {
            id: string;
            invoiceNumber: string;
            customer: string;
        } | null;
        candidates: number;
    }>;
}
