export declare class InvoiceItemDto {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate: number;
}
export declare class CreateInvoiceDto {
    tenantId?: string;
    customerId: string;
    paymentMethod?: string;
    paymentForm?: string;
    cfdiUse?: string;
    items: InvoiceItemDto[];
    status?: string;
}
