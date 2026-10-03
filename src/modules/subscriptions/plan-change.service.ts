import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ProviderSyncRepository } from 'src/common/webhooks/repositories/provider-sync.repository';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { LemonPlanChangeError } from 'src/shared/integrations/lemon-squeezy/exceptions/lemon-plan-change.error';
import type { LemonSqueezySubscriptionData } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy-webhook.types';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import type { PlanChangeEligibilityDto, PlanChangeResultDto, PlanSelection, SubscriptionPlanState } from './types/plan-change.types';
import {
  IneligiblePlanChangeException,
  PlanChangeConflictException,
  PlanChangeUnconfirmedException,
  UnsupportedPlanPaymentException,
} from './exceptions/plan-change.exceptions';
import { getPlanChangeEligibility } from './plan-change-eligibility';
import { confirmsUpgradePayment, isPendingScheduledChange, isPendingUpgrade, projectProviderPlanChange } from './plan-change';

@Injectable()
export class PlanChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SubscriptionsRepository,
    private readonly plans: PlansService,
    private readonly provider: LemonSqueezyService,
    private readonly sync: ProviderSyncRepository,
  ) {}

  async getEligibility(tenantId: string, selection: PlanSelection): Promise<PlanChangeEligibilityDto> {
    return this.evaluateEligibility(await this.requireSubscription(tenantId), selection);
  }

  async change(tenantId: string, selection: PlanSelection): Promise<PlanChangeResultDto> {
    const local = await this.requireSubscription(tenantId);
    // Same target retries only inspect state; they never send another charge request.
    if (this.samePendingSelection(local, selection)) {
      return this.result(local);
    }
    if (!local.pendingPlanId && local.planId === selection.planId && local.billingCycle === selection.cycle) {
      return this.result(local);
    }
    const eligibility = await this.evaluateEligibility(local, selection);
    if (!eligibility.eligible) {
      throw new IneligiblePlanChangeException(eligibility.blockers);
    }
    const current = await this.provider.retrieveSubscription(local.lemonSubscriptionId!);
    this.verifyProviderAssociation(local, current);
    if (current.attributes.payment_processor !== 'stripe') {
      throw new UnsupportedPlanPaymentException();
    }
    this.verifyProviderPlan(local, current, selection);
    const requestedAt = eligibility.kind === 'upgrade' ? new Date() : eligibility.kind === 'undo' ? local.planChangesAt! : null;
    await this.reserveChange(local, selection, requestedAt);

    try {
      const updated = await this.provider.updateSubscriptionPlan(
        current.id,
        this.plans.getVariantId(selection.planId, selection.cycle),
        eligibility.chargeImmediately,
      );
      const resolved = this.plans.resolvePlanByVariantId(String(updated.attributes.variant_id));
      if (resolved.planId !== selection.planId || resolved.cycle !== selection.cycle) {
        throw new PlanChangeUnconfirmedException();
      }
      if (selection.cycle !== local.billingCycle && Date.parse(updated.attributes.renews_at ?? '') !== local.currentPeriodEnd!.getTime()) {
        throw new PlanChangeUnconfirmedException();
      }
      return await this.confirmProviderState(tenantId, updated);
    } catch (error) {
      // A rejected request can be cleared. A timeout might have charged, so preserve intent for refresh/webhooks.
      if (error instanceof LemonPlanChangeError && error.rejected) {
        await this.repository.restorePlanChange(local, selection.planId, requestedAt);
        throw new IneligiblePlanChangeException([
          { code: 'PROVIDER_PLAN_CHANGE_REJECTED', message: 'El proveedor rechazó el cambio. Tu plan actual continúa vigente.' },
        ]);
      }
      throw new PlanChangeUnconfirmedException();
    }
  }

  async cancel(tenantId: string): Promise<PlanChangeResultDto> {
    const local = await this.requireSubscription(tenantId);
    if (!local.pendingPlanId) {
      return this.result(local);
    }
    if (!isPendingScheduledChange(local) || !local.planChangesAt) {
      throw new PlanChangeConflictException();
    }
    return this.change(tenantId, { planId: local.planId as PlanSelection['planId'], cycle: local.billingCycle! });
  }

  async refresh(tenantId: string): Promise<PlanChangeResultDto> {
    const local = await this.requireSubscription(tenantId);
    if (!local.pendingPlanId || !local.lemonSubscriptionId) {
      return this.result(local);
    }
    return this.confirmProviderState(tenantId, await this.provider.retrieveSubscription(local.lemonSubscriptionId));
  }

  private async evaluateEligibility(local: SubscriptionPlanState, selection: PlanSelection): Promise<PlanChangeEligibilityDto> {
    const tenantId = local.tenantId;
    const [tenant, usage] = await Promise.all([this.repository.getCheckoutTenant(tenantId), this.repository.getResourceUsage(tenantId)]);
    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Workspace not found.');
    }
    return getPlanChangeEligibility({ local, selection, target: this.plans.getPlan(selection.planId), tenant, usage });
  }

  private async confirmProviderState(tenantId: string, current: LemonSqueezySubscriptionData) {
    const before = await this.requireSubscription(tenantId);
    this.verifyProviderAssociation(before, current);
    const invoice = isPendingUpgrade(before) ? await this.provider.retrieveLatestInvoice(current.id) : null;

    return this.prisma.$transaction(async (tx) => {
      await this.sync.acquireLock(tx);
      const local = await this.repository.findByTenantId(tenantId, tx);
      if (!local) {
        throw new NotFoundException('Subscription not found.');
      }
      const target = this.plans.resolvePlanByVariantId(String(current.attributes.variant_id));
      const update = projectProviderPlanChange(local, current, target, confirmsUpgradePayment(local, current, invoice));
      const resource = `subscriptions:${current.id}`;
      const newer = await this.sync.isNewer(resource, current.attributes.updated_at, tx);
      const sameVersion = !newer && (await this.sync.matchesVersion(resource, current.attributes.updated_at, tx));
      if (!newer && !sameVersion) {
        return this.result(local);
      }
      const updated = await this.repository.updateByTenantId(tenantId, update, tx);
      if (newer) {
        await this.sync.markVersion(resource, current.attributes.updated_at, tx);
      }
      return this.result(updated);
    });
  }

  private verifyProviderPlan(local: SubscriptionPlanState, current: LemonSqueezySubscriptionData, selection: PlanSelection) {
    const providerPlan = this.plans.resolvePlanByVariantId(String(current.attributes.variant_id));
    if (selection.cycle !== local.billingCycle && Date.parse(current.attributes.renews_at ?? '') !== local.currentPeriodEnd!.getTime()) {
      throw new PlanChangeConflictException();
    }
    const scheduled = isPendingScheduledChange(local) && Boolean(local.planChangesAt);
    const expectedPlan = scheduled ? local.pendingPlanId : local.planId;
    const expectedCycle = scheduled ? local.pendingBillingCycle : local.billingCycle;
    if (providerPlan.planId !== expectedPlan || providerPlan.cycle !== expectedCycle || current.attributes.status !== 'active') {
      throw new PlanChangeConflictException();
    }
  }

  private async reserveChange(local: SubscriptionPlanState, selection: PlanSelection, requestedAt: Date | null) {
    await this.prisma.$transaction(async (tx) => {
      await this.sync.acquireLock(tx);
      const latest = await this.repository.findByTenantId(local.tenantId, tx);
      if (!latest || latest.updatedAt.getTime() !== local.updatedAt.getTime()) {
        throw new PlanChangeConflictException();
      }
      if (selection.planId !== local.planId) {
        const usage = await this.repository.getResourceUsage(local.tenantId, tx);
        const plan = this.plans.getPlan(selection.planId);
        if (usage.professionals > plan.maxProfessionals || usage.services > plan.maxServices) {
          throw new IneligiblePlanChangeException([
            { code: 'PLAN_LIMIT_REACHED', message: 'El uso del negocio cambió. Revisa los límites del plan antes de continuar.' },
          ]);
        }
      }
      const reserved = await this.repository.reservePlanChange(local, selection.planId, selection.cycle, requestedAt, tx);
      if (reserved.count !== 1) {
        throw new PlanChangeConflictException();
      }
    });
  }

  private verifyProviderAssociation(local: SubscriptionPlanState, current: LemonSqueezySubscriptionData) {
    if (local.lemonSubscriptionId !== current.id || local.lemonCustomerId !== String(current.attributes.customer_id)) {
      throw new PlanChangeConflictException();
    }
  }

  private samePendingSelection(local: SubscriptionPlanState, selection: PlanSelection): boolean {
    return local.pendingPlanId === selection.planId && local.pendingBillingCycle === selection.cycle;
  }

  private async requireSubscription(tenantId: string): Promise<SubscriptionPlanState> {
    await this.repository.applyDuePlanChanges(tenantId);
    const local = await this.repository.findByTenantId(tenantId);
    if (!local || local.deletedAt) {
      throw new NotFoundException('Subscription not found.');
    }
    return local;
  }

  private result(local: SubscriptionPlanState): PlanChangeResultDto {
    return {
      state: local.pendingPlanId ? 'pending' : 'confirmed',
      planId: local.planId,
      pendingPlanId: local.pendingPlanId ?? null,
      pendingBillingCycle: local.pendingBillingCycle ?? null,
      planChangesAt: local.planChangesAt?.toISOString() ?? null,
    };
  }
}
