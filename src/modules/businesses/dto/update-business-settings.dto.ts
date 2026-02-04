import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateBusinessSettingsDto {
  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['UYU', 'USD', 'ARS'])
  currency?: string;
}
