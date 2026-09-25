import { IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
