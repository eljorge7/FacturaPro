import { PosService } from './pos.service';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    checkout(payload: any, req: any): Promise<{
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
    getCurrentShift(req: any): Promise<({
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
    openShift(payload: any, req: any): Promise<{
        id: string;
        tenantId: string;
        openedAt: Date;
        closedAt: Date | null;
        openedById: string;
        closedById: string | null;
        startingCash: number;
        status: string;
    }>;
    getShiftSummary(req: any): Promise<{
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
    closeShift(req: any, payload: any): Promise<{
        id: string;
        tenantId: string;
        openedAt: Date;
        closedAt: Date | null;
        openedById: string;
        closedById: string | null;
        startingCash: number;
        status: string;
    }>;
    addMovement(req: any, payload: any): Promise<{
        id: string;
        cashShiftId: string;
        type: string;
        amount: number;
        reason: string;
        createdAt: Date;
    }>;
}
