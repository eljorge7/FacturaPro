export declare class CreateTaxProfileDto {
    tenantId: string;
    rfc: string;
    legalName: string;
    taxRegime: string;
    zipCode: string;
    cerBase64?: string;
    keyBase64?: string;
    keyPassword?: string;
    fielCerBase64?: string;
    fielKeyBase64?: string;
    fielPassword?: string;
    billingEmail?: string;
}
