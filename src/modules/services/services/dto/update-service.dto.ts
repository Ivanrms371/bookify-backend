import { Decimal } from '@prisma/client/runtime/client';
import { IsBoolean, IsDecimal, IsNumber, IsOptional, IsString } from 'class-validator';

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
  initialActiveMinutes: number;

  @IsNumber()
  @IsOptional()
  passiveTimeMinutes?: number;

  @IsNumber()
  @IsOptional()
  finalActiveMinutes?: number;

  @IsBoolean()
  isActive: boolean;
}
