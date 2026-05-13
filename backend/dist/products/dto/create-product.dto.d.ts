export declare class CreateProductDto {
    tenantId: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
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
    costPrice?: number;
    type?: string;
    kitComponents?: any[];
}
