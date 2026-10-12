import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { TenantCreatedEvent } from 'src/modules/tenants/events/tenant-created.event';
import { NotificationsService } from '../../application/services/notifications.service';
import { appointmentUrl } from '../../application/templates/_components/appointment-links';

@Injectable()
export class TenantCreatedListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('tenant.created', { suppressErrors: false })
  async handle(event: TenantCreatedEvent, tx?: TransactionClient) {
    const completedAt = new Date(event.completedAt);
    if (!Number.isFinite(completedAt.getTime())) throw new Error('Invalid onboarding completion date');
    const tenant = await (tx ?? this.prisma).tenant.findFirst({
      where: { id: event.tenantId, deletedAt: null, isActive: true, onboardingStatus: 'COMPLETED' },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: { select: { timeZone: true } },
        memberships: { where: { role: 'OWNER', isActive: true }, select: { userId: true } },
      },
    });
    if (!tenant?.slug) return;
    const businessPath = `/${encodeURIComponent(tenant.slug)}`;
    const origin = appointmentUrl(this.config.get<string>('FRONTEND_URL') || this.config.get<string>('APP_URL'));
    const businessUrl = origin ? new URL(businessPath, new URL(origin).origin).toString() : undefined;
    for (const owner of tenant.memberships) {
      await this.notifications.createOccurrence(
        {
          type: 'tenant.created',
          tenantId: tenant.id,
          referenceId: tenant.id,
          recipientType: 'USER',
          recipientId: owner.userId,
          occurrenceKey: `${tenant.id}:onboarding.completed:${owner.userId}`,
          expiresAt: new Date(completedAt.getTime() + 7 * 86_400_000),
          payload: {
            tenantName: tenant.name || 'Tu negocio',
            completedAt: completedAt.toISOString(),
            timeZone: tenant.settings?.timeZone || 'America/Montevideo',
            businessPath,
            ...(businessUrl ? { businessUrl } : {}),
          },
        },
        tx,
      );
    }
  }
}
