import { Decimal } from '@prisma/client/runtime/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDecimal, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  price: Decimal;

  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @IsDecimal()
  @IsOptional()
  discountFixed?: Decimal;

  @IsNumber()
  durationMinutes: number;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}
