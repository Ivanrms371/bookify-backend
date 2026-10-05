import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

// Every access transition and acceptance locks tenant, professional, then user.
// The tenant lock also serializes recipient-conflict checks without a migration.
export async function lockTenantAccess(tx: TransactionClient, tenantId: string) {
  await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId}::uuid FOR UPDATE`;
}
export async function lockProfessionalAccess(tx: TransactionClient, tenantId: string, id: string) {
  await lockTenantAccess(tx, tenantId);
  await tx.$queryRaw`SELECT id FROM professionals WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid FOR UPDATE`;
}

// Keep database-specific locking out of the acceptance business flow.
export async function lockInvitationAcceptance(
  tx: TransactionClient,
  invitation: { id: string; tenantId: string; professionalId: string | null },
  userId: string,
) {
  if (invitation.professionalId) {
    await lockProfessionalAccess(tx, invitation.tenantId, invitation.professionalId);
  } else {
    await lockTenantAccess(tx, invitation.tenantId);
  }
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM invitations WHERE id = ${invitation.id}::uuid FOR UPDATE`;
}
