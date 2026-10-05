import { TeamManagementForbiddenException, TeamRoleForbiddenException } from '../exceptions/team-management.exception';
import { MembershipRole } from 'src/generated/prisma/enums';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

export async function loadTeamManager(tx: TransactionClient, tenantId: string, userId: string) {
  const actor = await tx.membership.findFirst({ where: { tenantId, userId, isActive: true } });
  if (!actor?.isActive || (actor.role !== MembershipRole.OWNER && actor.role !== MembershipRole.ADMIN)) {
    throw new TeamManagementForbiddenException();
  }
  return actor;
}

export function verifyManageableRole(actorRole: MembershipRole, targetRole: MembershipRole, assignedRole?: MembershipRole) {
  if (
    targetRole === MembershipRole.OWNER ||
    assignedRole === MembershipRole.OWNER ||
    (actorRole === MembershipRole.ADMIN &&
      (targetRole !== MembershipRole.STAFF || (assignedRole !== undefined && assignedRole !== MembershipRole.STAFF)))
  ) {
    throw new TeamRoleForbiddenException();
  }
}
