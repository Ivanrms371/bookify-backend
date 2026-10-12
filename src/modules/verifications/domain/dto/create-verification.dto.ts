import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';

export class CreateVerificationDto {
  @IsOptional()
  @IsString()
  invitationToken?: string;

  @IsEnum(VerificationType)
  type: VerificationType;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsIn([RecipientType.USER, RecipientType.CUSTOMER])
  recipientType: RecipientType;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
