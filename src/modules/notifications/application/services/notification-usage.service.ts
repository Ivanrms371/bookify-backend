import { lockEntitlements } from 'src/common/database/entitlements-lock';
import { TenantUsageService } from 'src/modules/tenants/features/usage/tenant-usage.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotificationConfigService } from '../../notification-config.service';
import type { NotificationProcessorInput } from '../../types/notification-processor.type';
import type { UsageReservation } from '../../types/notification-usage.type';

@Injectable()
export class NotificationUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: NotificationConfigService,
    private readonly tenantUsageService: TenantUsageService,
  ) {}

  async reserve(delivery: NotificationProcessorInput): Promise<boolean> {
    const { notification, channel, id } = delivery;
    if (!this.config.isBillable(notification.type, notification.recipientType, channel)) return true;
    if (!notification.tenantId) return false;
    return this.prisma.$transaction(async (tx) => {
      await lockEntitlements(tx);
      const now = new Date();
      // Match release ordering: entitlements lock, delivery row, then usage/reservation rows.
      await tx.$queryRaw`SELECT id FROM notification_deliveries WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await this.tenantUsageService.ensureCurrentUsage(notification.tenantId!, tx, now);
      if ((channel === 'EMAIL' ? current.emailLimit : current.whatsappLimit) <= 0) return false;
      const [existing] = await tx.$queryRaw<UsageReservation[]>`
        SELECT usage_id AS "usageId", channel, state, ambiguous
        FROM notification_usage_reservations WHERE delivery_id = ${id}::uuid`;
      if (existing && existing.state !== 'RELEASED') return true;
      const count = channel === 'EMAIL' ? Prisma.sql`email_count` : Prisma.sql`whatsapp_count`;
      const limit = channel === 'EMAIL' ? Prisma.sql`email_limit` : Prisma.sql`whatsapp_limit`;
      // PostgreSQL rechecks the predicate after a competing update releases its row lock.
      const [usage] = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        UPDATE tenant_usages SET ${count} = ${count} + 1, updated_at = NOW()
        WHERE tenant_id = ${notification.tenantId}::uuid
          AND period_month = ${now.getUTCMonth() + 1} AND period_year = ${now.getUTCFullYear()}
          AND ${limit} > 0 AND ${count} < ${limit}
        RETURNING id`);
      if (!usage) return false;
      await tx.$executeRaw`
        INSERT INTO notification_usage_reservations (delivery_id, usage_id, channel)
        VALUES (${id}::uuid, ${usage.id}::uuid, ${channel}::"NotificationChannel")
        ON CONFLICT (delivery_id) DO UPDATE SET usage_id = EXCLUDED.usage_id,
          state = 'RESERVED', ambiguous = false`;
      return true;
    });
  }

  async confirm(deliveryId: string) {
    await this.prisma.$executeRaw`UPDATE notification_usage_reservations SET state = 'CONFIRMED'
      WHERE delivery_id = ${deliveryId}::uuid AND state = 'RESERVED'`;
  }

  async retain(deliveryId: string) {
    // A later rejected retry cannot undo a possibly accepted earlier attempt.
    await this.prisma.$executeRaw`UPDATE notification_usage_reservations SET ambiguous = true
      WHERE delivery_id = ${deliveryId}::uuid AND state = 'RESERVED'`;
  }

  async release(deliveryId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockEntitlements(tx);
      await tx.$queryRaw`SELECT id FROM notification_deliveries WHERE id = ${deliveryId}::uuid FOR UPDATE`;
      const [released] = await tx.$queryRaw<UsageReservation[]>`
        UPDATE notification_usage_reservations SET state = 'RELEASED'
        WHERE delivery_id = ${deliveryId}::uuid AND state = 'RESERVED' AND ambiguous = false
        RETURNING usage_id AS "usageId", channel`;
      if (!released) return;
      const count = released.channel === 'EMAIL' ? Prisma.sql`email_count` : Prisma.sql`whatsapp_count`;
      await tx.$executeRaw(Prisma.sql`UPDATE tenant_usages SET ${count} = ${count} - 1, updated_at = NOW()
        WHERE id = ${released.usageId}::uuid`);
    });
  }
}
