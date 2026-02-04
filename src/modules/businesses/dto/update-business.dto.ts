import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessType } from 'src/generated/prisma/enums';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BusinessType)
  @IsOptional()
  type?: BusinessType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string | null;

  @IsString()
  @IsOptional()
  coverUrl?: string | null;

  @IsString()
  @IsOptional()
  coverPublicId?: string | null;

  @IsString()
  @IsOptional()
  logoPublicId?: string | null;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  suscriptionPlan?: string;
}
