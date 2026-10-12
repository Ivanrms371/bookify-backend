import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { InvitationAcceptedEvent } from 'src/modules/invitations/events/invitation-accepted.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { TEAM_NOTIFICATION_ROLES } from '../../application/utils/member-notification-access';

@Injectable()
export class InvitationAcceptedListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent('invitation.accepted', { suppressErrors: false })
  async handle(event: InvitationAcceptedEvent, tx?: TransactionClient) {
    const acceptedAt = new Date(event.acceptedAt);
    if (!Number.isFinite(acceptedAt.getTime())) throw new Error('Invalid invitation acceptance date');
    const db = tx ?? this.prisma;
    const tenant = await db.tenant.findFirst({
      where: { id: event.tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        memberships: {
          where: { isActive: true, role: { in: TEAM_NOTIFICATION_ROLES }, userId: { not: event.userId } },
          select: { userId: true },
        },
      },
    });
    if (!tenant?.slug || !tenant.memberships.length) return;
    const member = await db.membership.findFirst({
      where: { id: event.membershipId, tenantId: tenant.id, userId: event.userId, isActive: true },
      select: { user: { select: { name: true } } },
    });
    if (!member) return;
    for (const recipient of tenant.memberships) {
      await this.notifications.createOccurrence(
        {
          type: 'member.joined',
          tenantId: tenant.id,
          referenceId: event.invitationId,
          recipientType: 'USER',
          recipientId: recipient.userId,
          occurrenceKey: `${tenant.id}:invitation.accepted:${event.invitationId}:${recipient.userId}`,
          expiresAt: new Date(acceptedAt.getTime() + 86_400_000),
          payload: {
            invitationId: event.invitationId,
            membershipId: event.membershipId,
            userId: event.userId,
            tenantId: tenant.id,
            memberName: member.user.name || 'Un miembro',
            businessName: tenant.name,
            role: event.role,
            acceptedAt: acceptedAt.toISOString(),
            teamPath: `/${encodeURIComponent(tenant.slug)}/settings?notificationTab=team`,
          },
        },
        tx,
      );
    }
  }
}
