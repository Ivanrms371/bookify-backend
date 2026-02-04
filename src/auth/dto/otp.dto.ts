import { IsString, Length } from 'class-validator';

export class SendOtpDto {
  @IsString()
  phone: string;
}

export class ValidateOtpDto {
  @IsString()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
