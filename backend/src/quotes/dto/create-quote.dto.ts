import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  taxRate: number;

  @IsNumber()
  @IsOptional()
  discount?: number;
}

export class CreateQuoteDto {
  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  taxIncluded?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
