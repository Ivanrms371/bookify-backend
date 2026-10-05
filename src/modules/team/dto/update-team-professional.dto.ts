import { IsBoolean, IsIn, ValidateIf } from 'class-validator';
import { ProfessionalContactDto } from './professional-contact.dto';
import { ACCESS_STATUSES } from '../types/professional-access.types';
import type { ProfessionalAccessStatus } from '../types/professional-access.types';

export class UpdateTeamProfessionalDto extends ProfessionalContactDto {
  @ValidateIf((_, value) => value !== undefined)
  declare name?: string;
  @ValidateIf((_, value) => value !== undefined)
  declare email?: string;
  @ValidateIf((_, value) => value !== undefined)
  declare phoneNumber?: string;
  @ValidateIf((_, value) => value !== undefined)
  declare phoneCountryCode?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  giveAccess?: boolean;

  @ValidateIf((o, value) => o.giveAccess !== undefined || value !== undefined)
  @IsIn(ACCESS_STATUSES)
  accessStatus?: ProfessionalAccessStatus;
}
