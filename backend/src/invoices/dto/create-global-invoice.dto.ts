import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateGlobalInvoiceDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  globalPeriod: string; // "01" (Diario), "02" (Semanal), "03" (Quincenal), "04" (Mensual)

  @IsString()
  @IsNotEmpty()
  globalMonths: string; // "01" a "12", o "13", "14" para bimestrales...

  @IsString()
  @IsNotEmpty()
  globalYear: string; // e.g. "2026"
}
