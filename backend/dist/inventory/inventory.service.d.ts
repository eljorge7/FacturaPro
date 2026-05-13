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
}
