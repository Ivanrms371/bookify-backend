import type { MembershipRole } from 'src/generated/prisma/enums';

export type MemberJoinedVariables = {
  invitationId: string;
  membershipId: string;
  userId: string;
  tenantId: string;
  memberName: string;
  businessName: string;
  role: MembershipRole;
  acceptedAt: string;
  teamPath: string;
};
