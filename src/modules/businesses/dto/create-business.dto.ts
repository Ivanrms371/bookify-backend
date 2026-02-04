import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BusinessType } from 'src/generated/prisma/enums';

export class CreateBasicBusinessDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateBusinessDto {
  @IsString()
  @IsUUID()
  ownerId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  type?: BusinessType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

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
