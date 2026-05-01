import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(tenantId: string, body: {
        name: string;
        description?: string;
    }): Promise<{
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
    getPayrollStats(tenantId: string): Promise<{
        name: string;
        Historico: number;
        Proyectado: number;
    }[]>;
    update(id: string, tenantId: string, body: {
        name: string;
    }): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
