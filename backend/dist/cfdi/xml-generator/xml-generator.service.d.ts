export declare class XmlGeneratorService {
    generate(invoice: any, taxProfile: any): Promise<{
        xml: string;
        sello: string;
        cadenaOriginal: string;
    }>;
}
