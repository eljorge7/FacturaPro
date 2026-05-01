import { PrismaService } from '../prisma/prisma.service';
export declare class BankAccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        transactions: {
            id: string;
            bankAccountId: string;
            date: Date;
            amount: number;
            description: string;
            reference: string | null;
            reconciled: boolean;
            type: string;
            paymentId: string | null;
            supplierPaymentId: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        currency: string;
        accountNum: string | null;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        currency: string;
        accountNum: string | null;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(tenantId: string, id: string): Promise<({
        transactions: {
            id: string;
            bankAccountId: string;
            date: Date;
            amount: number;
            description: string;
            reference: string | null;
            reconciled: boolean;
            type: string;
            paymentId: string | null;
            supplierPaymentId: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        currency: string;
        accountNum: string | null;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(tenantId: string, id: string, data: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(tenantId: string, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
