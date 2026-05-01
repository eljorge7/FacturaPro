export declare class CreateCustomerDto {
    tenantId: string;
    legalName: string;
    rfc: string;
    taxRegime: string;
    zipCode: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    tdsEnabled?: boolean;
    portalEnabled?: boolean;
}
