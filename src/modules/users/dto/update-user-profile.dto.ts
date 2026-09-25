import { IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto {
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
  avatarUrl?: string;
}
