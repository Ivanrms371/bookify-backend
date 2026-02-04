import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BusinessType } from 'src/generated/prisma/enums';

export class OnboardingBusinessStep1DTO {
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

export class OnboardingBusinessStep2DTO {
  @IsString()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class OnboardingBusinessStep3DTO {
  @IsString()
  @IsOptional()
  logo?: Express.Multer.File;

  @IsString()
  @IsOptional()
  cover?: Express.Multer.File;
}
