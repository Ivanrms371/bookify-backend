import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class CustomizeStepDto {
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsHexColor()
  colorTheme?: string | null;

  @IsOptional()
  @IsString()
  logoPublicId?: string | null;

  @IsOptional()
  @IsString()
  coverPublicId?: string | null;
}
