import { IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';

export class UpdateInvitationDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
