import { IsEnum, IsOptional, IsString } from 'class-validator';
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

export class OnBoardingUploadFilesDTO {
  @IsString()
  userId: string;
  @IsString()
  businessId: string;

  @IsOptional()
  logo?: Express.Multer.File;

  cover: Express.Multer.File;
}
