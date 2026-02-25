import { Decimal } from '@prisma/client/runtime/client';
import { IsBoolean, IsDecimal, IsNumber, IsOptional } from 'class-validator';

export class UpdateServiceAssigmentDto {
  @IsOptional()
  @IsDecimal()
  customPrice: Decimal;

  @IsOptional()
  @IsDecimal()
  customDiscountPercentage: Decimal;

  @IsOptional()
  @IsDecimal()
  customDiscountFixed: Decimal;

  @IsOptional()
  @IsNumber()
  customDurationMinutes: number;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
