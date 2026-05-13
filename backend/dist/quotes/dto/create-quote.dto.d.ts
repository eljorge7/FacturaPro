export declare class QuoteItemDto {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount?: number;
}
export declare class CreateQuoteDto {
    tenantId?: string;
    customerId: string;
    expirationDate?: string;
    notes?: string;
    taxIncluded?: boolean;
    items: QuoteItemDto[];
}
