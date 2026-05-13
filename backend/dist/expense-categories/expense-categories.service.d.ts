import { PrismaService } from '../prisma/prisma.service';
export declare class ExpenseCategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
