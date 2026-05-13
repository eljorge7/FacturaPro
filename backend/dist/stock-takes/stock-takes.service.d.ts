import { PrismaService } from '../prisma/prisma.service';
export declare class StockTakesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: any): Promise<{
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
        auditor: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            avatar: string | null;
            birthDate: Date | null;
            role: string;
            customRoleId: string | null;
            tenantId: string;
            warehouseId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        warehouseId: string;
        status: string;
        auditorId: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
    findAll(tenantId: string): Promise<({
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
        _count: {
            items: number;
        };
        auditor: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            avatar: string | null;
            birthDate: Date | null;
            role: string;
            customRoleId: string | null;
            tenantId: string;
            warehouseId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        warehouseId: string;
        status: string;
        auditorId: string | null;
        createdAt: Date;
        completedAt: Date | null;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
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
            stockTakeId: string;
            productId: string;
            expectedQty: number;
            countedQty: number | null;
            discrepancy: number | null;
            applied: boolean;
        })[];
        auditor: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            avatar: string | null;
            birthDate: Date | null;
            role: string;
            customRoleId: string | null;
            tenantId: string;
            warehouseId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        warehouseId: string;
        status: string;
        auditorId: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
    submitCounts(tenantId: string, id: string, counts: {
        itemId: string;
        countedQty: number;
    }[]): Promise<{
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
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
            stockTakeId: string;
            productId: string;
            expectedQty: number;
            countedQty: number | null;
            discrepancy: number | null;
            applied: boolean;
        })[];
        auditor: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            avatar: string | null;
            birthDate: Date | null;
            role: string;
            customRoleId: string | null;
            tenantId: string;
            warehouseId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        warehouseId: string;
        status: string;
        auditorId: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
    applyAdjustments(tenantId: string, id: string): Promise<{
        warehouse: {
            id: string;
            tenantId: string;
            name: string;
            address: string | null;
            isDefault: boolean;
        };
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
            stockTakeId: string;
            productId: string;
            expectedQty: number;
            countedQty: number | null;
            discrepancy: number | null;
            applied: boolean;
        })[];
        auditor: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            avatar: string | null;
            birthDate: Date | null;
            role: string;
            customRoleId: string | null;
            tenantId: string;
            warehouseId: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        warehouseId: string;
        status: string;
        auditorId: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
}
