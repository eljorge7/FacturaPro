import { PrismaService } from '../prisma/prisma.service';
export declare class EfosService {
    private readonly prisma;
    private readonly logger;
    private readonly SAT_EFOS_URL;
    constructor(prisma: PrismaService);
    syncEfosList(): Promise<unknown>;
    verifyRfc(rfc: string): Promise<boolean>;
}
