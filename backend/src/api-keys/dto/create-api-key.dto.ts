import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  keyHash: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
