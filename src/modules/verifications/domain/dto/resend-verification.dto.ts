import { IsEmail, IsEnum } from 'class-validator';
import { VerificationType } from 'src/generated/prisma/enums';

export class ResendVerificationDto {
  @IsEnum(VerificationType)
  type: VerificationType;

  @IsEmail()
  email: string;
}
