import { BankAccountsService } from './bank-accounts.service';
export declare class BankAccountsController {
    private readonly bankAccountsService;
    constructor(bankAccountsService: BankAccountsService);
    findAll(req: any): Promise<({
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
    create(req: any, data: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        currency: string;
        accountNum: string | null;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(req: any, id: string): Promise<({
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
    update(req: any, id: string, data: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
