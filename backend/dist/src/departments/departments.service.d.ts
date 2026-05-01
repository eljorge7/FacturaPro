import { PrismaService } from '../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, name: string, description?: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string): Promise<({
        _count: {
            employees: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, tenantId: string, name: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPayrollStats(tenantId: string): Promise<{
        name: string;
        Historico: number;
        Proyectado: number;
    }[]>;
}
