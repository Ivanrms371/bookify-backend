import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';
import { OTP_CODE_LENGTH } from '../verification-rules';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @IsString()
  @Length(OTP_CODE_LENGTH, OTP_CODE_LENGTH)
  @Matches(/^\d+$/, { message: 'code must be numeric' })
  code: string;

  @IsEnum(VerificationType)
  type: VerificationType;
}
