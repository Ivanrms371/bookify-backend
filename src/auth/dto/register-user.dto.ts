import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
