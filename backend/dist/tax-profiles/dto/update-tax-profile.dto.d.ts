import { CreateTaxProfileDto } from './create-tax-profile.dto';
declare const UpdateTaxProfileDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTaxProfileDto>>;
export declare class UpdateTaxProfileDto extends UpdateTaxProfileDto_base {
    logoBase64?: string;
    pdfTemplate?: string;
    logoWidth?: number;
    removeLogo?: boolean;
    baseCurrency?: string;
}
export {};
