import { IsEmail, IsEnum, IsString } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class InviteTeamMemberDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;
}
