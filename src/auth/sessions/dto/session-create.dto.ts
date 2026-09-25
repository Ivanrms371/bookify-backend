import { IsIP, IsOptional, IsString } from 'class-validator';

export class SessionCreateDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
