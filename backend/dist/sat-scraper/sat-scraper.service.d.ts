import { PrismaService } from '../prisma/prisma.service';
export declare class SatScraperService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private loginWithFiel;
    scanBuzonTributario(tenantId: string): Promise<{
        success: boolean;
        messages: {
            asunto: string;
            fecha: string;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messages?: undefined;
    }>;
    downloadOpinion32D(tenantId: string): Promise<{
        success: boolean;
        pdfBase64: string;
    }>;
}
