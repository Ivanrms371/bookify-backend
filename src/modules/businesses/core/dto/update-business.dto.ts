import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BusinessType } from 'src/generated/prisma/enums';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
  @IsEnum(BusinessType)
  @IsOptional()
  type?: BusinessType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phone?: string;

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

  @IsNumber()
  @IsOptional()
  onboardingStep?: number;
}
