import { PrismaService } from '../prisma/prisma.service';
export declare class TimeOffService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRequest(tenantId: string, employeeId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        status: string;
        reason: string | null;
        adminNotes: string | null;
        deductedDays: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyRequests(tenantId: string, employeeId: string): Promise<{
        id: string;
        tenantId: string;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        status: string;
        reason: string | null;
        adminNotes: string | null;
        deductedDays: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getAllRequests(tenantId: string): Promise<({
        employee: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            jobTitle: string | null;
            departmentRef: {
                id: string;
                tenantId: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        };
    } & {
        id: string;
        tenantId: string;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        status: string;
        reason: string | null;
        adminNotes: string | null;
        deductedDays: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    updateStatus(tenantId: string, id: string, status: string, adminNotes?: string, deductedDays?: number): Promise<{
        id: string;
        tenantId: string;
        employeeId: string;
        type: string;
        startDate: Date;
        endDate: Date;
        status: string;
        reason: string | null;
        adminNotes: string | null;
        deductedDays: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
