import { Decimal } from '@prisma/client/runtime/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { coerceToDecimal, coerceToInt, coerceToNumber } from 'src/common/utils/to-decimal.util';

export const toBool = (v: unknown) => v === 'true' || v === true;

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => coerceToDecimal(value))
  @IsDefined()
  price: Decimal;

  @Transform(({ value }) => coerceToInt(value))
  @IsInt()
  @IsOptional()
  discountPercentage?: number;

  @Transform(({ value }) => coerceToDecimal(value))
  @IsOptional()
  discountFixed?: Decimal;

  @Transform(({ value }) => coerceToNumber(value))
  @IsNumber()
  durationMinutes: number;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}
