export declare class CreateProductDto {
    tenantId: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    isFavorite?: boolean;
    stock?: number;
    minStock?: number;
    maxStock?: number;
    imageUrl?: string;
    trackInventory?: boolean;
    locationShelf?: string;
    satProductCode?: string;
    satUnitCode?: string;
    price: number;
    taxType: string;
    taxIncluded?: boolean;
    costPrice?: number;
    type?: string;
    isPublishedToStore?: boolean;
    storeCategory?: string;
    kitComponents?: any[];
}
