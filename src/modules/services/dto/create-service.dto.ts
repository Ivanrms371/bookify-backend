import { Decimal } from '@prisma/client/runtime/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { coerceToDecimal, coerceToInt } from 'src/common/utils/to-decimal.util';
import { IsMutuallyExclusiveDiscountConstraint, toBool } from './service.constraints';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  imagePublicId?: string;

  @Transform(({ value }) => coerceToDecimal(value))
  @IsDefined()
  price: Decimal;

  @Transform(({ value }) => coerceToInt(value))
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Validate(IsMutuallyExclusiveDiscountConstraint)
  discountPercentage?: number;

  @Transform(({ value }) => coerceToDecimal(value))
  @IsOptional()
  @Validate(IsMutuallyExclusiveDiscountConstraint)
  discountFixed?: Decimal;

  @Transform(({ value }) => coerceToInt(value))
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true; // Valor por defecto sincronizado con Prisma

  @Transform(({ value }) => coerceToInt(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0; // Valor por defecto para ordenamiento

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') return [value];
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  professionalIds?: string[];
}
