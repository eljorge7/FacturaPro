import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
export declare class PosService {
    private prisma;
    private invoicesService;
    constructor(prisma: PrismaService, invoicesService: InvoicesService);
    checkout(tenantId: string, payload: any): Promise<{
        taxProfile: {
            id: string;
            tenantId: string;
            rfc: string;
            legalName: string;
            taxRegime: string;
            zipCode: string;
            cerBase64: string | null;
            keyBase64: string | null;
            keyPassword: string | null;
            fielCerBase64: string | null;
            fielKeyBase64: string | null;
            fielPassword: string | null;
            billingEmail: string | null;
            billingPhone: string | null;
            logoUrl: string | null;
            logoWidth: number;
            pdfTemplate: string;
            brandColor: string;
            brandFont: string;
            baseCurrency: string;
            createdAt: Date;
            updatedAt: Date;
        };
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
        items: {
            id: string;
            invoiceId: string;
            productId: string | null;
            description: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            taxRate: number;
            total: number;
        }[];
    } & {
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
    }>;
    getCurrentShift(tenantId: string): Promise<({
        openedBy: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        id: string;
        tenantId: string;
        openedAt: Date;
        closedAt: Date | null;
        openedById: string;
        closedById: string | null;
        startingCash: number;
        status: string;
    }) | null>;
    openShift(tenantId: string, payload: {
        startingCash: number;
        userId: string;
    }): Promise<{
        id: string;
        tenantId: string;
        openedAt: Date;
        closedAt: Date | null;
        openedById: string;
        closedById: string | null;
        startingCash: number;
        status: string;
    }>;
    getShiftSummary(tenantId: string, shiftId: string): Promise<{
        id: string;
        startingCash: number;
        status: string;
        openedAt: Date;
        openedByName: string;
        cashSales: number;
        cardSales: number;
        transferSales: number;
        totalSales: number;
        cashIn: number;
        cashOut: number;
        expectedCash: number;
        movementsCount: number;
        salesCount: number;
    }>;
    closeShift(tenantId: string, shiftId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        openedAt: Date;
        closedAt: Date | null;
        openedById: string;
        closedById: string | null;
        startingCash: number;
        status: string;
    }>;
    addMovement(tenantId: string, shiftId: string, payload: {
        type: string;
        amount: number;
        reason: string;
    }): Promise<{
        id: string;
        cashShiftId: string;
        type: string;
        amount: number;
        reason: string;
        createdAt: Date;
    }>;
}
