import { IsIP, IsOptional, IsString } from 'class-validator';

export class SessionCreateDto {
  @IsString()
  userId: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
