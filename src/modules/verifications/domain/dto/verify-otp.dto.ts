import { IsEnum, IsIn, IsNotEmpty, IsString, Length, Matches, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';
import { OTP_CODE_LENGTH } from '../verification-rules';

export class VerifyOtpDto {
  @IsOptional()
  @IsUUID()
  verificationId?: string;
  @ValidateIf((dto: VerifyOtpDto) => !dto.verificationId)
  @IsString()
  @IsNotEmpty()
  recipientId?: string;

  @ValidateIf((dto: VerifyOtpDto) => !dto.verificationId)
  @IsIn([RecipientType.USER, RecipientType.CUSTOMER])
  recipientType?: RecipientType;

  @IsString()
  @Length(OTP_CODE_LENGTH, OTP_CODE_LENGTH)
  @Matches(/^\d+$/, { message: 'code must be numeric' })
  code: string;

  @ValidateIf((dto: VerifyOtpDto) => !dto.verificationId)
  @IsEnum(VerificationType)
  type?: VerificationType;
}
