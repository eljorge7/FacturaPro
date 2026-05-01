import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxProfileDto } from './create-tax-profile.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateTaxProfileDto extends PartialType(CreateTaxProfileDto) {
  @IsOptional()
  @IsString()
  logoBase64?: string;

  @IsOptional()
  @IsString()
  pdfTemplate?: string;

  @IsOptional()
  @IsNumber()
  logoWidth?: number;

  @IsOptional()
  removeLogo?: boolean;

  @IsOptional()
  @IsString()
  baseCurrency?: string;
}
