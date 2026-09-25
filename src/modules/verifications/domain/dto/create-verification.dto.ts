import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';

export class CreateVerificationDto {
  @IsEnum(VerificationType)
  type: VerificationType;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
