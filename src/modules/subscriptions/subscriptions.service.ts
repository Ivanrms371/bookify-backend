// src/modules/subscriptions/subscriptions.service.ts

import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { addDays } from 'date-fns';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import { LemonSqueezyService } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.service';
import { BillingCycle, Currency, SubscriptionStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PlanId } from './plans.config';
import { sign } from 'crypto';
import { LemonSqueezySubscriptionStatus } from 'src/shared/integrations/lemon-squeezy/types/lemon-squeezy.types';

const TRIAL_DURATION_DAYS = 14;
const MIN_TRIAL_HOURS_THRESHOLD = 24;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

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
    const existingSubscription = await this.subscriptionsRepo.findByTenantId(tenantId, tx);

    if (existingSubscription) {
      throw new ConflictException(`Tenant "${tenantId}" already has a subscription.`);
    }

    const plan = this.plansService.resolveTrialPlan();
    const now = new Date();
    const trialEndsAt = addDays(now, TRIAL_DURATION_DAYS);

    return this.subscriptionsRepo.create(
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

  /**
   * Generates a signed Lemon Squeezy checkout session URL for purchasing or upgrading a plan.
   */
  async createCheckoutSession(tenantId: string, userEmail: string, userName: string | undefined, planId: PlanId, cycle: BillingCycle) {
    const subscription = await this.subscriptionsRepo.findByTenantId(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription record not found.');
    }

    const variantId = this.plansService.getVariantId(planId, cycle);

    let validTrialEndDate: string | undefined;

    if (subscription.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEndsAt);
      const diffInHours = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffInHours > MIN_TRIAL_HOURS_THRESHOLD) {
        validTrialEndDate = trialEnd.toISOString();
      }
    }

    return this.lemonSqueezyService.createCheckout({
      variantId,
      userEmail,
      userName,
      tenantId,
      trialEndsAt: validTrialEndDate,
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

  /**
   * Handles incoming Lemon Squeezy webhook payloads and updates internal state accordingly.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const payload = this.lemonSqueezyService.verifyWebhookSignature(rawBody, signature);

    const eventName = payload.meta.event_name;
    const { attributes } = payload.data;
    const lemonSubscriptionId = payload.data.id;

    this.logger.log(`Processing Lemon Squeezy webhook event: ${eventName}`);

    switch (eventName) {
      case 'subscription_created': {
        const tenantId = payload.meta.custom_data?.tenant_id;
        if (!tenantId) {
          this.logger.error('Missing tenant_id in webhook custom_data metadata.');
          return;
        }

        const resolvedPlan = this.plansService.resolvePlanByVariantId(String(attributes.variant_id));

        const periodEnd = attributes.renews_at ? new Date(attributes.renews_at) : attributes.ends_at ? new Date(attributes.ends_at) : null;

        await this.subscriptionsRepo.updateByTenantId(tenantId, {
          lemonSubscriptionId,
          lemonCustomerId: String(attributes.customer_id),
          status: this.mapLemonStatus(attributes.status),
          planId: resolvedPlan.planId,
          billingCycle: resolvedPlan.cycle,
          amount: resolvedPlan.price,
          currentPeriodStart: new Date(attributes.created_at),
          currentPeriodEnd: periodEnd,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          cancelledAt: null,
          paymentMethod: attributes.card_brand ? `${attributes.card_brand} **** ${attributes.card_last_four ?? ''}`.trim() : null,
        });
        break;
      }

      case 'subscription_updated':
      case 'subscription_resumed': {
        const resolvedPlan = this.plansService.resolvePlanByVariantId(String(attributes.variant_id));

        const periodEnd = attributes.renews_at ? new Date(attributes.renews_at) : attributes.ends_at ? new Date(attributes.ends_at) : null;

        await this.subscriptionsRepo.updateByLemonSubscriptionId(lemonSubscriptionId, {
          status: this.mapLemonStatus(attributes.status),
          planId: resolvedPlan.planId,
          billingCycle: resolvedPlan.cycle,
          amount: resolvedPlan.price,
          currentPeriodEnd: periodEnd,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          ...(eventName === 'subscription_resumed' && { cancelledAt: null }),
          ...(attributes.card_brand && {
            paymentMethod: `${attributes.card_brand} **** ${attributes.card_last_four ?? ''}`.trim(),
          }),
        });
        break;
      }

      case 'subscription_cancelled': {
        const endsAtDate = attributes.ends_at ? new Date(attributes.ends_at) : null;

        await this.subscriptionsRepo.updateByLemonSubscriptionId(lemonSubscriptionId, {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          endsAt: endsAtDate,
          ...(endsAtDate && { currentPeriodEnd: endsAtDate }),
        });
        break;
      }

      case 'subscription_expired': {
        const endsAtDate = attributes.ends_at ? new Date(attributes.ends_at) : null;

        await this.subscriptionsRepo.updateByLemonSubscriptionId(lemonSubscriptionId, {
          status: SubscriptionStatus.EXPIRED,
          ...(endsAtDate && {
            endsAt: endsAtDate,
            currentPeriodEnd: endsAtDate,
          }),
        });
        break;
      }

      case 'subscription_payment_failed': {
        await this.subscriptionsRepo.updateByLemonSubscriptionId(lemonSubscriptionId, {
          status: SubscriptionStatus.PAST_DUE,
        });
        break;
      }

      default:
        this.logger.debug(`Unhandled event ignored: ${eventName}`);
    }
  }

  /**
   * Maps provider-specific status strings into internal domain SubscriptionStatus enum values.
   */
  private mapLemonStatus(status: LemonSqueezySubscriptionStatus): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'on_trial':
        return SubscriptionStatus.TRIAL;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'cancelled':
        return SubscriptionStatus.CANCELLED;
      case 'expired':
        return SubscriptionStatus.EXPIRED;
      case 'paused':
        return SubscriptionStatus.PAUSED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
}
