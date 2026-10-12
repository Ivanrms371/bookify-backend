import { Injectable } from '@nestjs/common';
import { lockEntitlements } from 'src/common/database/entitlements-lock';
import type { Subscription } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { getSubscriptionAccess } from 'src/modules/subscriptions/subscription-access';
import { PLANS } from 'src/modules/subscriptions/plans.config';
import type { PlanId } from 'src/modules/subscriptions/types/plan.types';
import { FreePlanLimitException } from './exceptions/free-plan-limit.exception';
import { TenantUsageRepository } from './tenant-usage.repository';
import { TenantQuotaMapper } from './mappers/tenant-usage.mapper';
import type { EnforcedLimits, NotificationLimits, ResourceUsage, ResourceUsageMetric, TenantUsageStatus } from './types/tenant-usage.types';

@Injectable()
export class TenantUsageService {
  constructor(
    private readonly tenantUsageRepository: TenantUsageRepository,
    private readonly prisma: PrismaService,
  ) {}

  // Callers acquire the entitlements lock before row locks and capture now after it.
  async ensureCurrentUsage(tenantId: string, tx: TransactionClient, now: Date) {
    const subscription = await this.tenantUsageRepository.findSubscription(tenantId, tx);
    const plan = this.effectivePlan(subscription, now);
    const limits = { emailLimit: plan?.monthlyEmails ?? 0, whatsappLimit: plan?.monthlyWhatsapp ?? 0 };
    const period = { tenantId, periodMonth: now.getUTCMonth() + 1, periodYear: now.getUTCFullYear() };
    const existing = await this.tenantUsageRepository.findPeriod(period, tx);
    if (!existing) return this.tenantUsageRepository.createPeriod(period, limits, now, tx);
    const changedLimits: Partial<NotificationLimits> = {};
    if (existing.emailLimit !== limits.emailLimit) changedLimits.emailLimit = limits.emailLimit;
    if (existing.whatsappLimit !== limits.whatsappLimit) changedLimits.whatsappLimit = limits.whatsappLimit;
    if (!Object.keys(changedLimits).length) return existing;
    return this.tenantUsageRepository.updateNotificationLimits(period, changedLimits, tx);
  }

  getCurrentUsage(tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockEntitlements(tx);
      return this.ensureCurrentUsage(tenantId, tx, new Date());
    });
  }

  async getResourceUsage(tenantId: string, tx?: TransactionClient): Promise<ResourceUsage> {
    const [professionals, services] = await Promise.all([
      this.tenantUsageRepository.countProfessionals(tenantId, tx),
      this.tenantUsageRepository.countServices(tenantId, tx),
    ]);
    return { professionals, services, countBasis: 'non_deleted' };
  }

  getUsageStatus(tenantId: string): Promise<TenantUsageStatus> {
    return this.prisma.$transaction(async (tx) => {
      await lockEntitlements(tx);
      const now = new Date();
      const current = await this.ensureCurrentUsage(tenantId, tx, now);
      const subscription = await this.tenantUsageRepository.findSubscription(tenantId, tx);
      const plan = this.effectivePlan(subscription, now);
      const usage = await this.getResourceUsage(tenantId, tx);
      const catalogLimits = { professionals: plan?.maxProfessionals ?? null, services: plan?.maxServices ?? null };
      return {
        ...TenantQuotaMapper.toDomain(current),
        professionals: this.resourceMetric(usage.professionals, catalogLimits.professionals),
        services: this.resourceMetric(usage.services, catalogLimits.services),
        catalogLimits,
        enforcedLimits: this.enforcedLimits(subscription),
      };
    });
  }

  assertCanAddProfessional(tenantId: string, tx: TransactionClient) {
    return this.assertCanAddResource(tenantId, 'professionals', 1, tx);
  }

  assertCanAddServices(tenantId: string, quantity: number, tx: TransactionClient) {
    return this.assertCanAddResource(tenantId, 'services', quantity, tx);
  }

  private async assertCanAddResource(tenantId: string, resource: 'professionals' | 'services', quantity: number, tx: TransactionClient) {
    await lockEntitlements(tx);
    const subscription = await this.tenantUsageRepository.findSubscription(tenantId, tx);
    const limit = this.enforcedLimits(subscription)[resource];
    if (limit === null) return;
    const used =
      resource === 'professionals'
        ? await this.tenantUsageRepository.countProfessionals(tenantId, tx)
        : await this.tenantUsageRepository.countServices(tenantId, tx);
    if (used + quantity > limit) throw new FreePlanLimitException(resource, used, limit);
  }

  private enforcedLimits(subscription: Subscription | null): EnforcedLimits {
    const enforceFree =
      subscription && !subscription.deletedAt && (subscription.planId === 'free' || subscription.pendingPlanId === 'free');
    return enforceFree
      ? { professionals: PLANS.free.maxProfessionals, services: PLANS.free.maxServices }
      : { professionals: null, services: null };
  }

  private effectivePlan(subscription: Subscription | null, now: Date) {
    const id = getSubscriptionAccess(subscription, false, now).effectivePlanId;
    return id && Object.hasOwn(PLANS, id) ? PLANS[id as PlanId] : null;
  }

  private resourceMetric(count: number, limit: number | null): ResourceUsageMetric {
    return { count, limit, percentage: limit === null ? null : limit === 0 ? 0 : (count / limit) * 100 };
  }
}
