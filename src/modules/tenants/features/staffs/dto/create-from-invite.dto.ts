import { IsEmail, IsEnum, IsString } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class CreateFromInviteDto {
  @IsString()
  tenantId: string;

  @IsString()
  userId: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;

  @IsString()
  displayName: string;
}
