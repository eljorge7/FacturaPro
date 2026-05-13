import { SuppliersService } from './suppliers.service';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string): Promise<({
        expenses: {
            id: string;
            tenantId: string;
            supplierId: string | null;
            categoryId: string | null;
            amount: number;
            taxTotal: number;
            total: number;
            currency: string;
            exchangeRate: number;
            date: Date;
            isDeductible: boolean;
            satUuid: string | null;
            description: string | null;
            xmlContent: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(tenantId: string, id: string): Promise<({
        expenses: {
            id: string;
            tenantId: string;
            supplierId: string | null;
            categoryId: string | null;
            amount: number;
            taxTotal: number;
            total: number;
            currency: string;
            exchangeRate: number;
            date: Date;
            isDeductible: boolean;
            satUuid: string | null;
            description: string | null;
            xmlContent: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        legalName: string;
        rfc: string | null;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
