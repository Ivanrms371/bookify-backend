import { IsEmail, IsEnum, IsString } from 'class-validator';
import { BusinessRole } from 'src/generated/prisma/enums';

export class CreateFromInviteDto {
  @IsString()
  businessId: string;

  @IsString()
  userId: string;

  @IsEnum(BusinessRole)
  role: BusinessRole;

  @IsString()
  displayName: string;
}
