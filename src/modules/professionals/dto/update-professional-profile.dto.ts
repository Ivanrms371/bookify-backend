import { IsOptional, IsString } from 'class-validator';

export class UpdateProfessionalProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  phoneCountryCode?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  @IsString()
  @IsOptional()
  colorTheme?: string;
}
