import { Decimal } from '@prisma/client/runtime/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUrl, Max, Min, Validate } from 'class-validator';
import { coerceToDecimal, coerceToInt } from 'src/common/utils/to-decimal.util';
import { IsMutuallyExclusiveDiscountConstraint, toBool } from './service.constraints';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  imagePublicId?: string;

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToDecimal(value) : value))
  @IsOptional()
  price?: Decimal;

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToInt(value) : value))
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Validate(IsMutuallyExclusiveDiscountConstraint)
  discountPercentage?: number;

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToDecimal(value) : value))
  @IsOptional()
  @Validate(IsMutuallyExclusiveDiscountConstraint)
  discountFixed?: Decimal;

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToInt(value) : value))
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @Transform(({ value }) => (value !== undefined && value !== null ? toBool(value) : value))
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToInt(value) : value))
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') return [value];
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  professionalIds?: string[];
}
