import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        status: string;
        reference: string | null;
        issueDate: Date;
        receivedDate: Date | null;
    }>;
    findAll(tenantId: string): import(".prisma/client").Prisma.PrismaPromise<({
        items: ({
            product: {
                id: string;
                tenantId: string;
                sku: string | null;
                barcode: string | null;
                name: string;
                description: string | null;
                price: number;
                costPrice: number | null;
                type: string;
                stock: number;
                minStock: number;
                maxStock: number | null;
                trackInventory: boolean;
                hasSerials: boolean;
                supplierSku: string | null;
                locationShelf: string | null;
                imageUrl: string | null;
                currency: string;
                satProductCode: string | null;
                satUnitCode: string | null;
                taxIncluded: boolean;
                taxRate: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            transferOrderId: string;
            productId: string;
            quantity: number;
            receivedQty: number;
        })[];
        fromWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
        toWarehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
    } & {
        id: string;
        tenantId: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        status: string;
        reference: string | null;
        issueDate: Date;
        receivedDate: Date | null;
    })[]>;
    receive(tenantId: string, id: string, body: any): Promise<{
        id: string;
        tenantId: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        status: string;
        reference: string | null;
        issueDate: Date;
        receivedDate: Date | null;
    }>;
    resolveDiscrepancy(tenantId: string, id: string, body: {
        action: 'MERMA' | 'RETURN_TO_ORIGIN';
    }): Promise<{
        id: string;
        tenantId: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        status: string;
        reference: string | null;
        issueDate: Date;
        receivedDate: Date | null;
    }>;
}
