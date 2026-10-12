import { Injectable, Logger } from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { ProviderSyncRepository } from 'src/common/webhooks/repositories/provider-sync.repository';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import { projectProviderPlanChange } from './plan-change';
import type { BillingNoticeState } from './types/billing-notice-state.types';

@Injectable()
export class BillingNoticeStateService {
  private readonly logger = new Logger(BillingNoticeStateService.name);
  private activeRequests = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: LemonSqueezyService,
    private readonly sync: ProviderSyncRepository,
    private readonly repository: SubscriptionsRepository,
    private readonly plans: PlansService,
  ) {}

  findState(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, deletedAt: null, tenant: { deletedAt: null, isActive: true } },
      include: {
        tenant: {
          include: {
            settings: { select: { timeZone: true } },
            memberships: { where: { role: 'OWNER', isActive: true }, select: { userId: true } },
          },
        },
      },
    });
  }

  async ensureRenewalChecked(state: BillingNoticeState, now: Date, timeZone: string): Promise<boolean> {
    const checked = state.renewalCheckedAt;
    if (
      checked &&
      now.getTime() - checked.getTime() >= 0 &&
      now.getTime() - checked.getTime() < 86_400_000 &&
      formatInTimeZone(checked, timeZone, 'yyyy-MM-dd') === formatInTimeZone(now, timeZone, 'yyyy-MM-dd')
    )
      return true;
    if (!state.lemonSubscriptionId || !state.lemonCustomerId) return false;
    const claimed = await this.prisma.subscription.updateMany({
      where: {
        id: state.id,
        tenantId: state.tenantId,
        lemonSubscriptionId: state.lemonSubscriptionId,
        deletedAt: null,
        OR: [{ renewalCheckAttemptedAt: null }, { renewalCheckAttemptedAt: { lte: new Date(now.getTime() - 300_000) } }],
      },
      data: { renewalCheckAttemptedAt: now },
    });
    if (claimed.count !== 1) return false;

    // All provider I/O stays outside the billing transaction.
    const current = await this.withProviderSlot(() => this.provider.retrieveSubscription(state.lemonSubscriptionId!));
    if (current.id !== state.lemonSubscriptionId || String(current.attributes.customer_id) !== state.lemonCustomerId) {
      throw new Error('Billing notice provider association mismatch');
    }
    return this.prisma.$transaction(async (tx) => {
      await this.sync.acquireLock(tx);
      const local = await this.repository.findByTenantId(state.tenantId, tx);
      if (!local || local.deletedAt || local.lemonSubscriptionId !== current.id || local.lemonCustomerId !== state.lemonCustomerId)
        return false;
      const resource = `subscriptions:${current.id}`;
      const newer = await this.sync.isNewer(resource, current.attributes.updated_at, tx);
      if (!newer && !(await this.sync.matchesVersion(resource, current.attributes.updated_at, tx))) return false;
      // An intent created while the request was in flight requires a later authoritative read.
      if (local.updatedAt > now && (local.pendingPlanId || local.planChangeUndoRequestedAt)) return false;
      const target = this.plans.resolvePlanByVariantId(String(current.attributes.variant_id));
      await this.repository.updateByTenantId(
        state.tenantId,
        {
          // A notice refresh never confirms an upgrade payment.
          ...projectProviderPlanChange(local, current, target, false),
          renewalCheckedAt: now,
        },
        tx,
      );
      if (newer) await this.sync.markVersion(resource, current.attributes.updated_at, tx);
      return true;
    });
  }
  private async withProviderSlot<T>(work: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= 2) await new Promise<void>((resolve) => this.waiting.push(resolve));
    else this.activeRequests++;
    try {
      return await work();
    } catch (error) {
      this.logger.warn('Billing notice provider verification failed; retry on the next planner cycle');
      throw error;
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.activeRequests--;
    }
  }
}
