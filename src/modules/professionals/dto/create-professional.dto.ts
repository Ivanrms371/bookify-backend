import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  @IsOptional()
  colorTheme?: string | null;

  @IsString()
  @IsOptional()
  avatarUrl?: string | null;

  @IsString()
  @IsOptional()
  avatarPublicId?: string | null;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phoneCountryCode: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];
}
