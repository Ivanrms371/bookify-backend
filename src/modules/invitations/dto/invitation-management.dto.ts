import type { MembershipRole } from 'src/generated/prisma/enums';
export interface InvitationManagementDto {
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  status: 'PENDING' | 'EXPIRED';
  expiresAt: string;
}
