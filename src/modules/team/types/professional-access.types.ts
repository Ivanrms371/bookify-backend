import type { MembershipRole } from 'src/generated/prisma/enums';
export const ACCESS_STATUSES = ['NONE', 'PENDING', 'EXPIRED', 'ACTIVE', 'DISABLED'] as const;
export type ProfessionalAccessStatus = (typeof ACCESS_STATUSES)[number];
export type AccessViewer = { id: string; role: MembershipRole };

import type { Professional, Membership, Invitation } from 'src/generated/prisma/client';
export type ProfessionalAccessAction = 'KEEP' | 'INVITE' | 'CANCEL_INVITATION' | 'DISABLE_MEMBERSHIP' | 'RESTORE_MEMBERSHIP';
export type ProfessionalAccessContext = {
  professional: Professional;
  membership: Membership | null;
  invitation: Invitation | null;
  status: ProfessionalAccessStatus;
};
export type ProfessionalContactFields = { name?: string; email?: string; phoneCountryCode?: string; phoneNumber?: string };
