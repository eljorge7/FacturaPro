import { PrismaService } from '../prisma/prisma.service';
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        permissions: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string): Promise<{
        permissions: any;
        _count: {
            users: number;
        };
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        permissions: any;
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        permissions: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        permissions: string;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
