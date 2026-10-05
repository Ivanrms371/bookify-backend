import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class InviteTeamMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @IsIn([MembershipRole.ADMIN, MembershipRole.STAFF])
  role: MembershipRole;
}
