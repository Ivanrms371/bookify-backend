import { IsIn } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class UpdateInvitationDto {
  @IsIn([MembershipRole.ADMIN, MembershipRole.STAFF])
  role: MembershipRole;
}
