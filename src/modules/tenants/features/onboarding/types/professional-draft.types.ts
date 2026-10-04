import type { ProfessionalStepDto } from '../dto/professional-step.dto';
export type ProfessionalDraft = Pick<
  ProfessionalStepDto,
  'attendsClients' | 'name' | 'email' | 'phoneCountryCode' | 'phoneNumber' | 'profession' | 'serviceIds'
>;
