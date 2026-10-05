import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { ProfessionalContactDto } from './professional-contact.dto';

export class CreateTeamProfessionalDto extends ProfessionalContactDto {
  declare name: string;
  declare email: string;
  declare phoneNumber: string;
  declare phoneCountryCode: string;
  @IsBoolean()
  giveAccess: boolean;

  // Compatibility only: this creation flow always invites STAFF.
  @IsOptional()
  @IsIn([MembershipRole.STAFF])
  role?: MembershipRole;
}
