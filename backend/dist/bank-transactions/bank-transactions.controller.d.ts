import { BankTransactionsService } from './bank-transactions.service';
import { VisionReconciliationService } from './vision-reconciliation.service';
export declare class BankTransactionsController {
    private readonly bankTransactionsService;
    private readonly visionService;
    constructor(bankTransactionsService: BankTransactionsService, visionService: VisionReconciliationService);
    findAll(req: any, bankAccountId: string): Promise<({
        payment: ({
            invoice: {
                customer: {
                    legalName: string;
                };
                invoiceNumber: string;
            };
        } & {
            id: string;
            invoiceId: string;
            amount: number;
            paymentDate: Date;
            paymentMethod: string;
            reference: string | null;
            notes: string | null;
            createdAt: Date;
        }) | null;
    } & {
        id: string;
        bankAccountId: string;
        date: Date;
        amount: number;
        description: string;
        reference: string | null;
        reconciled: boolean;
        type: string;
        paymentId: string | null;
        supplierPaymentId: string | null;
        createdAt: Date;
    })[]>;
    createBatch(req: any, bankAccountId: string, data: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getSuggestions(req: any, txId: string): Promise<{
        matchScore: number;
        customer: {
            id: string;
            tenantId: string;
            legalName: string;
            rfc: string;
            taxRegime: string | null;
            zipCode: string | null;
            email: string | null;
            phone: string | null;
            street: string | null;
            city: string | null;
            state: string | null;
            tdsEnabled: boolean;
            portalEnabled: boolean;
            creditEnabled: boolean;
            creditLimit: number;
            creditDays: number;
            creditStatus: string;
            createdAt: Date;
            updatedAt: Date;
        };
        id: string;
        tenantId: string;
        taxProfileId: string;
        customerId: string;
        quoteId: string | null;
        invoiceNumber: string;
        date: Date;
        dueDate: Date | null;
        satUuid: string | null;
        paymentMethod: string | null;
        paymentForm: string | null;
        cfdiUse: string | null;
        subtotal: number;
        taxTotal: number;
        tdsTotal: number;
        total: number;
        currency: string;
        exchangeRate: number;
        cashShiftId: string | null;
        customFields: import(".prisma/client").Prisma.JsonValue | null;
        status: string;
        xmlContent: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        globalInvoiceId: string | null;
        isGlobal: boolean;
        globalPeriod: string | null;
        globalMonths: string | null;
        globalYear: string | null;
    }[]>;
    reconcileInvoice(req: any, transactionId: string, invoiceId: string): Promise<{
        id: string;
        bankAccountId: string;
        date: Date;
        amount: number;
        description: string;
        reference: string | null;
        reconciled: boolean;
        type: string;
        paymentId: string | null;
        supplierPaymentId: string | null;
        createdAt: Date;
    }>;
    moveTransaction(req: any, transactionId: string, targetBankAccountId: string): Promise<{
        success: boolean;
    }>;
    deleteTransaction(req: any, transactionId: string): Promise<{
        success: boolean;
    }>;
    processReceiptVision(req: any, accountId: string, file: Express.Multer.File): Promise<{
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
