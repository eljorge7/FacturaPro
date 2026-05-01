import { PrismaService } from '../prisma/prisma.service';
export declare class BovedaSatService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private cleanBase64;
    private getSatService;
    requestDownload(tenantId: string, period: {
        start: string;
        end: string;
    }, type: 'issued' | 'received'): Promise<{
        idSolicitud: any;
        status: string;
        message: any;
        rfc: string;
        period: {
            start: string;
            end: string;
        };
    }>;
    verifyDownload(tenantId: string, idSolicitud: string): Promise<{
        idSolicitud: string;
        status: string;
        statusCode: any;
        message: any;
        paquetes: any;
    }>;
    getRequests(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        taxProfileId: string;
        idSolicitud: string;
        requestType: string;
        periodStart: Date;
        periodEnd: Date;
        status: string;
        message: string | null;
        packageIds: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    downloadAndProcessPackage(tenantId: string, idPaquete: string): Promise<{
        processStats: {
            invoicesCreated: number;
            expensesCreated: number;
            duplicatesIgnored: number;
        };
        packageSize: any;
        message: string;
    }>;
    private findSolicitudIdByPackage;
}
