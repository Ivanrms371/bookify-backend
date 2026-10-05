import { IsBoolean, IsIn, ValidateIf } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';
export class UpdateTeamMemberDto {
  @ValidateIf((dto: UpdateTeamMemberDto) => dto.role !== undefined || dto.isActive === undefined)
  @IsIn([MembershipRole.ADMIN, MembershipRole.STAFF])
  role?: MembershipRole;

  @ValidateIf((dto: UpdateTeamMemberDto) => dto.isActive !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
