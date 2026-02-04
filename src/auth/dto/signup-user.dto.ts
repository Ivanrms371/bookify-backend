import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SignupDto {
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
