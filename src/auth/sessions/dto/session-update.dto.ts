import { IsIP, IsOptional, IsString } from 'class-validator';

export class SessionUpdateDto {
  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  lastUsedAt?: Date;
  @IsString()
  @IsOptional()
  revokedAt?: Date;

  @IsString()
  @IsOptional()
  expiresAt?: Date;
}
