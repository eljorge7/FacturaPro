import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
export declare class PortalController {
    private readonly invoicesService;
    private readonly pdfService;
    constructor(invoicesService: InvoicesService, pdfService: PdfService);
    getPublicInvoice(id: string): Promise<{
        id: string;
        invoiceNumber: string;
        date: Date;
        status: string;
        total: number;
        subtotal: number;
        taxTotal: number;
        currency: string;
        satUuid: string | null;
        paymentForm: string | null;
        paymentMethod: string | null;
        cfdiUse: string | null;
        createdAt: Date;
        customer: {
            legalName: string;
            rfc: string;
            zipCode: string | null;
            email: string | null;
        };
        items: {
            description: string;
            quantity: number;
            unitPrice: number;
            total: number;
        }[];
        payments: {
            id: string;
            amount: number;
            paymentDate: Date;
            paymentMethod: string;
            reference: string | null;
        }[];
        taxProfile: {
            legalName: string;
            rfc: string;
            logoUrl: string | null;
            brandColor: string;
            brandFont: string;
            pdfTemplate: string;
        };
    }>;
    downloadPublicPdf(id: string, res: any): Promise<void>;
    downloadPublicXml(id: string, res: any): Promise<any>;
}
