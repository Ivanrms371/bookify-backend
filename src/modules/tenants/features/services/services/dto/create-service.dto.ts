import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

const toNumber = (v: unknown) => (v === '' || v === undefined ? undefined : Number(v));
const toBool = (v: unknown) => v === 'true' || v === true;

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  price: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  discountPercentage?: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  discountFixed?: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  initialActiveMinutes: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  passiveTimeMinutes?: number;

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @IsOptional()
  finalActiveMinutes?: number;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];
}
