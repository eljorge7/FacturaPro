import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    create(tenantId: string, createWarehouseDto: CreateWarehouseDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }>;
    findAll(tenantId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }>;
    setAsDefault(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }>;
    update(tenantId: string, id: string, body: {
        name: string;
        address?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        isDefault: boolean;
    }>;
}
