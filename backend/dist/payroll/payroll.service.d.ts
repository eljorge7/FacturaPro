import { PrismaService } from '../prisma/prisma.service';
export declare class PayrollService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        tenantId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date | null;
        status: string;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        payslips: ({
            employee: {
                id: string;
                tenantId: string;
                userId: string | null;
                firstName: string;
                lastName: string;
                phone: string | null;
                email: string | null;
                employeeNumber: string | null;
                department: string | null;
                departmentId: string | null;
                jobTitle: string | null;
                employeeType: string;
                rfc: string | null;
                curp: string | null;
                nss: string | null;
                baseSalary: number | null;
                avatarUrl: string | null;
                shirtSize: string | null;
                pantsSize: string | null;
                shoeSize: string | null;
                bloodType: string | null;
                emergencyContact: string | null;
                hireDate: Date | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            payrollRunId: string;
            employeeId: string;
            baseSalary: number;
            bonuses: number;
            deductions: number;
            netPay: number;
            status: string;
            auditSignature: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date | null;
        status: string;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createDraft(tenantId: string, periodStart: string, periodEnd: string): Promise<{
        id: string;
        tenantId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date | null;
        status: string;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    unrollDraft(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        periodStart: Date;
        periodEnd: Date;
        paymentDate: Date | null;
        status: string;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePayslip(tenantId: string, runId: string, payslipId: string, data: any): Promise<{
        id: string;
        payrollRunId: string;
        employeeId: string;
        baseSalary: number;
        bonuses: number;
        deductions: number;
        netPay: number;
        status: string;
        auditSignature: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    executePayRun(tenantId: string, runId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
