import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';

export class InvoiceItemDto {
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
  @IsOptional()
  discount?: number;

  @IsNumber()
  taxRate: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsOptional()
  tenantId?: string; // Si no se pasa, usamos el primero (al ser local)

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'PUE';

  @IsString()
  @IsOptional()
  paymentForm?: string = '03'; // Transferencia

  @IsString()
  @IsOptional()
  cfdiUse?: string = 'G03';

  @IsArray()
  @IsNotEmpty()
  items: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  status?: string;
}
