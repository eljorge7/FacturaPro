import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaxProfileDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  rfc: string;

  @IsString()
  @IsNotEmpty()
  legalName: string;

  @IsString()
  @IsNotEmpty()
  taxRegime: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsOptional()
  @IsString()
  cerBase64?: string;

  @IsOptional()
  @IsString()
  keyBase64?: string;

  @IsOptional()
  @IsString()
  keyPassword?: string;
  
  @IsOptional()
  @IsString()
  fielCerBase64?: string;

  @IsOptional()
  @IsString()
  fielKeyBase64?: string;

  @IsOptional()
  @IsString()
  fielPassword?: string;

  @IsOptional()
  @IsString()
  billingEmail?: string;
}
