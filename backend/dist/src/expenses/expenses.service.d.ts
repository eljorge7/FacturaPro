import { PrismaService } from '../prisma/prisma.service';
export declare class ExpensesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        supplier: {
            id: string;
            tenantId: string;
            legalName: string;
            rfc: string | null;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        category: {
            id: string;
            tenantId: string;
            name: string;
            color: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
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
    })[]>;
    create(tenantId: string, data: any): Promise<{
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
    }>;
    delete(id: string): Promise<{
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
    }>;
    parseXml(tenantId: string, fileContent: string): Promise<{
        providerRfc: string;
        providerName: string;
        subtotal: number;
        total: number;
        taxTotal: number;
        uuid: string;
        date: Date;
        isBelongingToTenant: boolean;
        receiverRfc: string;
        tenantRfcs: string[];
        xmlContentRaw: string;
    }>;
}
