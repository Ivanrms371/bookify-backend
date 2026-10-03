import { BadRequestException, InternalServerErrorException, Injectable, NotFoundException } from '@nestjs/common';
import { addDays } from 'date-fns';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { BillingCycle, Currency, SubscriptionStatus } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PlanId } from './plans.config';
import type { CheckoutEligibilityDto } from './dto/checkout.dto';
import type { BillingSummaryDto } from './dto/billing-summary.dto';
import { getSubscriptionAccess } from './subscription-access';
import { toPlanDto } from './mappers/plan.mapper';
import { getCheckoutEligibility } from './checkout-eligibility';

const TRIAL_DURATION_DAYS = 14;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly plansService: PlansService,
    private readonly lemonSqueezyService: LemonSqueezyService,
  ) {}

  /**
   * Creates the initial trial subscription for a newly registered tenant.
   * Can be executed within an existing Prisma transaction client.
   */
  async createTrialSubscription(tenantId: string, tx?: TransactionClient) {
    const plan = this.plansService.resolveTrialPlan();
    const now = new Date();
    const trialEndsAt = addDays(now, TRIAL_DURATION_DAYS);

    return this.subscriptionsRepo.ensureTrial(
      tenantId,
      {
        tenant: { connect: { id: tenantId } },
        planId: plan.id,
        trialStartedAt: now,
        trialEndsAt,
        status: SubscriptionStatus.TRIAL,
        currency: Currency.USD,
        amount: null,
        billingCycle: null,
      },
      tx,
    );
  }

  /**
   * Retrieves the current subscription details for a specific tenant.
   */
  async getSubscriptionByTenantId(tenantId: string) {
    const subscription = await this.subscriptionsRepo.findByTenantId(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found for this workspace.');
    }
    return subscription;
  }

  getCatalog() {
    return this.plansService.getCatalog();
  }

  async getAccess(tenantId: string, canManageBilling: boolean) {
    return getSubscriptionAccess(await this.subscriptionsRepo.findByTenantId(tenantId), canManageBilling);
  }

  async getBillingSummary(tenantId: string): Promise<BillingSummaryDto> {
    const [record, usage] = await Promise.all([
      this.subscriptionsRepo.findByTenantId(tenantId),
      this.subscriptionsRepo.getResourceUsage(tenantId),
    ]);
    const subscription = record?.deletedAt ? null : record;
    const plan = this.plansService.getAllPlans().find((plan) => plan.id === subscription?.planId);
    const hasPortal = Boolean(subscription?.lemonCustomerId);
    return {
      subscription: subscription
        ? {
            id: subscription.id,
            planId: subscription.planId,
            status: subscription.status,
            cycle: subscription.billingCycle,
            amount: subscription.amount?.toFixed(2) ?? null,
            currency: subscription.currency,
            trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            endsAt: subscription.endsAt?.toISOString() ?? null,
            cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
            paymentMethod: subscription.paymentMethod,
          }
        : null,
      currentPlan: plan ? toPlanDto(plan) : null,
      access: getSubscriptionAccess(subscription, true),
      usage,
      allowedActions: {
        explorePlans: true,
        manageSubscription: hasPortal,
        cancelSubscription: hasPortal && subscription?.status !== 'CANCELLED',
      },
    };
  }

  private async checkoutContext(tenantId: string, planId: PlanId, cycle: BillingCycle) {
    if (!['MONTHLY', 'ANNUAL'].includes(cycle))
      throw new BadRequestException({ code: 'INVALID_BILLING_CYCLE', message: 'Ciclo de facturación no válido.' });
    const plan = this.plansService.getAllPlans().find((item) => item.id === planId);
    if (!plan) throw new BadRequestException({ code: 'PLAN_UNAVAILABLE', message: 'El plan no existe.' });
    const [tenant, subscription, usage] = await Promise.all([
      this.subscriptionsRepo.getCheckoutTenant(tenantId),
      this.subscriptionsRepo.findByTenantId(tenantId),
      this.subscriptionsRepo.getResourceUsage(tenantId),
    ]);
    if (!tenant || tenant.deletedAt || !tenant.slug) throw new NotFoundException('Workspace not found.');
    return {
      tenant,
      eligibility: getCheckoutEligibility({
        plan,
        cycle,
        workspaceType: tenant.workspaceType,
        subscription,
        professionals: usage.professionals,
      }),
    };
  }

  async getCheckoutEligibility(tenantId: string, planId: PlanId, cycle: BillingCycle): Promise<CheckoutEligibilityDto> {
    return (await this.checkoutContext(tenantId, planId, cycle)).eligibility;
  }

  async createCheckoutSession(tenantId: string, userEmail: string, userName: string | undefined, planId: PlanId, cycle: BillingCycle) {
    const { tenant, eligibility } = await this.checkoutContext(tenantId, planId, cycle);
    if (!eligibility.eligible)
      throw new BadRequestException({
        code: eligibility.blockers[0].code,
        message: eligibility.blockers.map((item) => item.message).join(' '),
        blockers: eligibility.blockers,
      });
    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new InternalServerErrorException('APP_URL is required for checkout.');
    const origin = new URL(appUrl);
    if (!['http:', 'https:'].includes(origin.protocol)) throw new InternalServerErrorException('Invalid APP_URL.');
    const redirectUrl = new URL(`/${encodeURIComponent(tenant.slug!)}/billing/return`, origin.origin);
    redirectUrl.searchParams.set('plan', planId);
    redirectUrl.searchParams.set('cycle', cycle);
    return this.lemonSqueezyService.createCheckout({
      variantId: this.plansService.getVariantId(planId, cycle),
      userEmail,
      userName,
      tenantId,
      redirectUrl: redirectUrl.toString(),
    });
  }

  /**
   * Retrieves an authenticated self-serve Lemon Squeezy Customer Portal URL.
   */
  async getCustomerPortalSession(tenantId: string) {
    const subscription = await this.subscriptionsRepo.findByTenantId(tenantId);
    if (!subscription?.lemonCustomerId) {
      throw new BadRequestException('No billing account registered yet for this workspace.');
    }

    return this.lemonSqueezyService.getCustomerPortalUrl(subscription.lemonCustomerId);
  }
}
