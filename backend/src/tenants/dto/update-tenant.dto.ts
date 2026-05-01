import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsString()
  subscriptionTier?: string;

  @IsOptional()
  @IsInt()
  availableStamps?: number;

  @IsOptional()
  subscriptionEndsAt?: Date | null;

  @IsOptional()
  @IsBoolean()
  hasExpenseControl?: boolean;

  @IsOptional()
  @IsBoolean()
  hasApiAccess?: boolean;
}
