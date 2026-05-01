import { PrismaService } from '../prisma/prisma.service';
export declare class DiotService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(tenantId: string): Promise<{
        ivaCobrado: number;
        ivaPagado: number;
        totalAPagar: number;
        saldoAFavor: number;
    }>;
}
