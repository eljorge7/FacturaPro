import { PrismaService } from '../prisma/prisma.service';
export declare class BankTransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllByAccount(tenantId: string, bankAccountId: string): Promise<({
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
    createBatch(tenantId: string, bankAccountId: string, transactions: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getSuggestions(tenantId: string, transactionId: string): Promise<{
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
    }[]>;
    reconcileInvoice(tenantId: string, transactionId: string, invoiceId: string): Promise<{
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
    moveTransaction(tenantId: string, transactionId: string, targetBankAccountId: string): Promise<{
        success: boolean;
    }>;
    deleteTransaction(tenantId: string, transactionId: string): Promise<{
        success: boolean;
    }>;
}
