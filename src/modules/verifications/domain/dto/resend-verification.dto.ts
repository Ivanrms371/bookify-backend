import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationType } from 'src/generated/prisma/enums';

export class ResendVerificationDto {
  @IsOptional()
  @IsString()
  invitationToken?: string;

  @IsEnum(VerificationType)
  type: VerificationType;

  @IsEmail()
  email: string;
}
