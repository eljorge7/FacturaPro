import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllMovements(tenantId: string): Promise<({
        product: {
            name: string;
            sku: string | null;
            supplierSku: string | null;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        type: string;
        quantity: number;
        reference: string | null;
        userId: string | null;
        createdAt: Date;
    })[]>;
    quickReceive(tenantId: string, payload: {
        productId: string;
        quantity: number;
        reference: string;
        batchNumber?: string;
        expiryDate?: string;
    }[]): Promise<{
        id: string;
        tenantId: string;
        sku: string | null;
        barcode: string | null;
        isFavorite: boolean;
        name: string;
        description: string | null;
        price: number;
        wholesalePrice: number | null;
        wholesaleMinQuantity: number | null;
        costPrice: number | null;
        type: string;
        stock: number;
        minStock: number;
        maxStock: number | null;
        trackInventory: boolean;
        hasSerials: boolean;
        hasBatches: boolean;
        soldByWeight: boolean;
        supplierSku: string | null;
        locationShelf: string | null;
        imageUrl: string | null;
        currency: string;
        satProductCode: string | null;
        satUnitCode: string | null;
        isPublishedToStore: boolean;
        storeCategory: string | null;
        taxIncluded: boolean;
        taxRate: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
