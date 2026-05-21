import { TimeOffService } from './time-off.service';
export declare class TimeOffController {
    private readonly timeOffService;
    constructor(timeOffService: TimeOffService);
    createRequest(req: any, data: any): Promise<{
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
    getMyRequests(req: any): Promise<{
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
    getAllRequests(req: any): Promise<({
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
    updateStatus(req: any, id: string, body: {
        status: string;
        adminNotes?: string;
        deductedDays?: number;
    }): Promise<{
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
