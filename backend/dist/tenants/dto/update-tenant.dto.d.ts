import { CreateTenantDto } from './create-tenant.dto';
declare const UpdateTenantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTenantDto>>;
export declare class UpdateTenantDto extends UpdateTenantDto_base {
    subscriptionTier?: string;
    availableStamps?: number;
    subscriptionEndsAt?: Date | null;
    hasExpenseControl?: boolean;
    hasApiAccess?: boolean;
}
export {};
