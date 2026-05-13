import { BovedaSatService } from './boveda-sat.service';
export declare class BovedaSatController {
    private readonly bovedaSatService;
    constructor(bovedaSatService: BovedaSatService);
    getRequests(req: any): Promise<{
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
    requestDownload(req: any, body: any): Promise<{
        idSolicitud: any;
        status: string;
        message: any;
        rfc: string;
        period: {
            start: string;
            end: string;
        };
    }>;
    verifyDownload(req: any, idSolicitud: string): Promise<{
        idSolicitud: string;
        status: string;
        statusCode: any;
        message: any;
        paquetes: any;
    }>;
    downloadPackage(req: any, idPaquete: string): Promise<{
        processStats: {
            invoicesCreated: number;
            expensesCreated: number;
            duplicatesIgnored: number;
        };
        packageSize: any;
        message: string;
    }>;
}
