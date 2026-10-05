import type { Invitation } from 'src/generated/prisma/client';
import type { InvitationManagementDto } from '../dto/invitation-management.dto';

export function toInvitationManagementDto(
  invitation: Invitation & { professional?: { name: string; tenantId: string } | null },
): InvitationManagementDto {
  const status = invitation.expiresAt <= new Date() ? 'EXPIRED' : 'PENDING';
  return {
    id: invitation.id,
    name: invitation.professional?.tenantId === invitation.tenantId ? invitation.professional.name : invitation.email,
    email: invitation.email,
    role: invitation.role,
    status,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}
