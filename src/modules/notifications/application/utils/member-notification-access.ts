import type { InAppNotificationWhereInput } from 'src/generated/prisma/models';
import { ROLE_PERMISSIONS, type Role } from 'src/common/security/constants/role-permissions.constants';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';

export const TEAM_NOTIFICATION_ROLES = (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((role) =>
  ROLE_PERMISSIONS[role].some((permission) => permission === PERMISSIONS.TEAM_READ),
);

// Apply permission changes to retained history as well as queued deliveries.
export function memberNoticeVisibility(tenantId: string, userId: string): InAppNotificationWhereInput {
  return {
    OR: [
      { type: { not: 'member.joined' } },
      {
        tenant: {
          isActive: true,
          deletedAt: null,
          memberships: {
            some: {
              tenantId,
              userId,
              isActive: true,
              role: { in: TEAM_NOTIFICATION_ROLES },
            },
          },
        },
      },
    ],
  };
}
