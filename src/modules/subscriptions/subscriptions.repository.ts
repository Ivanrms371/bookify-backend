import { invalidateRenewalForPendingChange } from './utils/renewal-projection';
import { TenantUsageService } from '../tenants/features/usage/tenant-usage.service';
import { lockEntitlements } from 'src/common/database/entitlements-lock';
import { freeActivation } from './utils/free-transition';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import type { Subscription } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { SubscriptionCreateInput, SubscriptionUpdateInput, SubscriptionUpdateManyMutationInput } from 'src/generated/prisma/models';
import { PLANS } from './plans.config';
import type { SubscriptionPlanState } from './types/plan-change.types';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository extends BaseRepository {
  constructor(prisma: PrismaService, private readonly tenantUsageService: TenantUsageService) {
    super(prisma);
  }

  getCheckoutTenant(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({ where: { id: tenantId }, select: { slug: true, workspaceType: true, deletedAt: true } });
  }

  async ensureTrial(tenantId: string, data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.writeWithUsage(tenantId, tx, (db) => db.subscription.upsert({ where: { tenantId }, create: data, update: {} }));
  }

  async getResourceUsage(tenantId: string, tx?: TransactionClient) {
    return this.tenantUsageService.getResourceUsage(tenantId, tx);
  }

  async findByTenantId(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).subscription.findUnique({
      where: { tenantId },
    });
  }

  async findByLemonSubscriptionId(lemonSubscriptionId: string, tx?: TransactionClient): Promise<Subscription | null> {
    return this.db(tx).subscription.findUnique({
      where: { lemonSubscriptionId },
    });
  }

  attachProviderSubscription(
    tenantId: string,
    previousProviderId: string | null,
    data: SubscriptionUpdateManyMutationInput,
    tx?: TransactionClient,
  ) {
    return this.writeWithUsage(tenantId, tx, (db) =>
      db.subscription.updateMany({
        where: { tenantId, deletedAt: null, lemonSubscriptionId: previousProviderId },
        data,
      }),
    );
  }

  reservePlanChange(
    local: SubscriptionPlanState,
    targetPlanId: string,
    cycle: 'MONTHLY' | 'ANNUAL',
    at: Date | null,
    tx: TransactionClient,
  ) {
    return this.writeWithUsage(local.tenantId, tx, (db) =>
      db.subscription.updateMany({
        where: {
          id: local.id,
          deletedAt: null,
          planId: local.planId,
          pendingPlanId: local.pendingPlanId ?? null,
          updatedAt: local.updatedAt,
        },
        data: { pendingPlanId: targetPlanId, pendingBillingCycle: cycle, planChangesAt: at, nextRenewalAt: null, renewalCheckedAt: null },
      }),
    );
  }

  restorePlanChange(local: SubscriptionPlanState, targetPlanId: string, at: Date | null) {
    return this.writeWithUsage(local.tenantId, undefined, (db) =>
      db.subscription.updateMany({
        where: { id: local.id, pendingPlanId: targetPlanId, planChangesAt: at },
        data: {
          pendingPlanId: local.pendingPlanId ?? null,
          pendingBillingCycle: local.pendingBillingCycle ?? null,
          planChangesAt: local.planChangesAt ?? null,
        },
      }),
    );
  }

  async applyDuePlanChanges(tenantId?: string, tx?: TransactionClient, now?: Date) {
    if (!tx) return this.prisma.$transaction((transaction) => this.applyDuePlanChanges(tenantId, transaction, now));
    await lockEntitlements(tx);
    now ??= new Date();
    const due = await tx.subscription.findMany({
      where: { tenantId, deletedAt: null, planChangesAt: { lte: now } },
      select: { tenantId: true },
    });
    await this.db(tx).subscription.updateMany({
      where: { tenantId, deletedAt: null, pendingPlanId: 'free', planChangeUndoRequestedAt: null, planChangesAt: { lte: now } },
      data: freeActivation,
    });
    // Confirmed downgrades and cycle switches expire; upgrades still require payment.
    for (const planId of ['pro', 'pro_plus'] as const) {
      for (const cycle of ['MONTHLY', 'ANNUAL'] as const) {
        await this.db(tx).subscription.updateMany({
          where: {
            tenantId,
            deletedAt: null,
            pendingPlanId: planId,
            pendingBillingCycle: cycle,
            planChangesAt: { lte: now },
            OR: [
              ...(planId === 'pro' ? [{ planId: 'pro_plus' }] : []),
              { planId, billingCycle: cycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY' },
            ],
          },
          data: {
            planId,
            billingCycle: cycle,
            amount: PLANS[planId].pricing[cycle]!.price,
            pendingPlanId: null,
            pendingBillingCycle: null,
            planChangesAt: null,
          },
        });
      }
    }
    for (const id of new Set(tenantId ? [tenantId] : due.map((item) => item.tenantId))) {
      await this.tenantUsageService.ensureCurrentUsage(id, tx, now);
    }
  }

  async updateByTenantId(tenantId: string, data: SubscriptionUpdateInput, tx?: TransactionClient): Promise<Subscription> {
    return this.writeWithUsage(tenantId, tx, (db) =>
      db.subscription.update({
        where: { tenantId },
        data: invalidateRenewalForPendingChange(data),
      }),
    );
  }

  async updateByLemonSubscriptionId(
    lemonSubscriptionId: string,
    data: SubscriptionUpdateInput,
    tx?: TransactionClient,
  ): Promise<Subscription> {
    if (!tx) return this.prisma.$transaction((db) => this.updateByLemonSubscriptionId(lemonSubscriptionId, data, db));
    await lockEntitlements(tx);
    const now = new Date();
    const updated = await tx.subscription.update({ where: { lemonSubscriptionId }, data: invalidateRenewalForPendingChange(data) });
    await this.tenantUsageService.ensureCurrentUsage(updated.tenantId, tx, now);
    return updated;
  }
  private async writeWithUsage<T>(
    tenantId: string,
    tx: TransactionClient | undefined,
    write: (db: TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!tx) return this.prisma.$transaction((db) => this.writeWithUsage(tenantId, db, write));
    await lockEntitlements(tx);
    const now = new Date();
    const result = await write(tx);
    await this.tenantUsageService.ensureCurrentUsage(tenantId, tx, now);
    return result;
  }
}
