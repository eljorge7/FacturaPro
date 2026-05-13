export declare class PacService {
    stampXml(xmlBase64: string, env?: 'SANDBOX' | 'PRODUCTION'): Promise<{
        satUuid: any;
        selloSAT: any;
        stampedXml: any;
        fechaTimbrado: any;
    }>;
    cancelCfdi(options: {
        uuid: string;
        passwordCsd: string;
        rfc: string;
        b64Cer: string;
        b64Key: string;
        motivo: string;
        folioSustitucion?: string;
    }, env?: 'SANDBOX' | 'PRODUCTION'): Promise<{
        acuse: any;
        status: string;
    }>;
}
