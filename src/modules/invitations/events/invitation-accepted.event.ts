import type { MembershipRole } from 'src/generated/prisma/enums';

export type InvitationAcceptedEvent = {
  tenantId: string;
  invitationId: string;
  membershipId: string;
  userId: string;
  role: MembershipRole;
  acceptedAt: string;
};
