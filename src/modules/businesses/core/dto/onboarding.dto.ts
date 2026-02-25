import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BusinessType, PlanType } from 'src/generated/prisma/enums';

export class UpdateProfileDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsEnum(BusinessType)
  type: BusinessType;
}

export class UpdateLocationDto {
  @IsString()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateAssetsDto {
  @IsString()
  @IsOptional()
  logo?: Express.Multer.File;

  @IsString()
  @IsOptional()
  cover?: Express.Multer.File;
}

export class SelectPlanDto {
  @IsString()
  @IsEnum(PlanType)
  planType: PlanType;
}
