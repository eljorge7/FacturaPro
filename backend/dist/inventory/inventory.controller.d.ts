import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getAllMovements(req: any): Promise<({
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
}
