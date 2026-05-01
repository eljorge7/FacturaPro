import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
