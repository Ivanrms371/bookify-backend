import { Decimal } from '@prisma/client/runtime/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { coerceToDecimal, coerceToInt, coerceToNumber } from 'src/common/utils/to-decimal.util';
import { toBool } from './create-service.dto';

export class CreateServiceBulkItemDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  name: string;

  @Transform(({ value }) => coerceToDecimal(value))
  @IsDefined()
  price: Decimal;

  @Transform(({ value }) => coerceToNumber(value))
  @IsNumber()
  durationMinutes: number;
}

export class CreateServicesBulkDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un servicio' })
  @ValidateNested({ each: true })
  @Type(() => CreateServiceBulkItemDto)
  services: CreateServiceBulkItemDto[];
}
