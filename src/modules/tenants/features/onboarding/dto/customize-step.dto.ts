import { IsOptional, IsString } from 'class-validator';

export class CustomizeStepDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  colorTheme?: string;
}
