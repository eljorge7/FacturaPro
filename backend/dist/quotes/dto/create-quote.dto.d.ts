export declare class QuoteItemDto {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount?: number;
    total: number;
    type?: string;
    orderIndex?: number;
    imageUrl?: string;
}
export declare class CreateQuoteDto {
    tenantId?: string;
    customerId: string;
    expirationDate?: string;
    notes?: string;
    taxIncluded?: boolean;
    isProposal?: boolean;
    projectName?: string;
    projectScope?: string;
    projectNotes?: string;
    coordinates?: string;
    personnel?: string;
    materials?: string;
    coverImageUrl?: string;
    templateId?: string;
    solarData?: string;
    items: QuoteItemDto[];
}
