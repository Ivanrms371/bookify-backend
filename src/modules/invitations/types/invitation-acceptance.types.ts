import type { Invitation, Membership, Professional } from 'src/generated/prisma/client';
import type { InvitationsRepository } from '../invitations.repository';
export type InvitationWithTenant = NonNullable<Awaited<ReturnType<InvitationsRepository['findByToken']>>>;
export type InvitationStatus = 'REVOKED' | 'ACCEPTED' | 'EXPIRED' | 'VALID';
export type AcceptedInvitationResponse = { success: true; tenantId: string; tenantSlug: string | null };
export type AcceptedInvitationAccess = { membership: Membership | null; professional: Professional | null };
