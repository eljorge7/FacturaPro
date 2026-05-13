import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
export declare class WarehousesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    update(tenantId: string, id: string, name: string, address?: string): Promise<{
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
