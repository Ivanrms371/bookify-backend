import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlansService } from 'src/modules/plans/plans.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { MercadoPagoService } from 'src/mercadopago/mercadopago.service';
import { addDays } from 'date-fns';
import { MercadoPagoPreapproval } from 'src/mercadopago/types/preapproval-subscription.type';
import { PlanType, SubscriptionStatus } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { Subscription } from 'src/generated/prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly plansService: PlansService,
  ) {}

  private isFree(planType: PlanType) {
    return planType === PlanType.FREE;
  }

  async findSubscriptionByBusinessId(businessId: string) {
    const subscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async createSubscription(businessId: string, planKey: PlanType, tx: TransactionClient) {
    if (this.isFree(planKey)) {
      return this.createFreeSubscription(businessId, tx);
    }
    return this.startTrial(businessId, planKey, tx);
  }

  async createFreeSubscription(businessId: string, tx?: TransactionClient) {
    const freePlan = await this.plansService.findFreePlan();

    const subscription = await this.subscriptionRepository.upsert(
      businessId,
      {
        business: { connect: { id: businessId } },
        plan: { connect: { id: freePlan.id } },
        status: 'ACTIVE',
        amount: freePlan.price,
        currency: freePlan.currency,
        billingCycle: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        nextPaymentDate: null,
        trialEndsAt: null,
        trialUsedAt: null,
      },
      tx,
    );

    return subscription;
  }

  async startTrial(businessId: string, planKey: PlanType, tx?: TransactionClient) {
    const plan = await this.plansService.findPlanByKey(planKey);
    const trialEndsAt = addDays(new Date(), plan.trialDays);

    const subscription = await this.subscriptionRepository.upsert(businessId, {
      business: { connect: { id: businessId } },
      plan: { connect: { id: plan.id } },
      status: 'TRIAL',
      amount: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
      nextPaymentDate: trialEndsAt,
      trialEndsAt,
      trialUsedAt: new Date(),
    });

    return subscription;
  }

  async createPaidSubscription(businessId: string, planKey: PlanType) {
    const plan = await this.plansService.findPlanByKey(planKey);

    if (this.plansService.isFreePlan(plan)) {
      throw new BadRequestException('Este plan es gratuito.');
    }

    // await this.businessService.(businessId);

    const existingSubscription = await this.subscriptionRepository.findByBusinessId(businessId);

    // frequency in base billin cycle
    const frequency = plan.billingCycle === 'MONTHLY' ? 1 : 12;
    const frequencyType = plan.billingCycle === 'MONTHLY' ? 'months' : 'years';
    const trialEndsAt = existingSubscription?.trialEndsAt ?? addDays(new Date(), plan.trialDays);
    const startDate = existingSubscription?.trialUsedAt ? trialEndsAt : new Date();

    // create preapproval (subscription) in mercadopago
    const preapproval = await this.mercadoPagoService.createSubscription({
      reason: `Plan ${plan.name} - Turnify`,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: plan.price.toNumber(),
        currency_id: plan.currency,
        start_date: startDate.toISOString(),
      },
      back_url: 'https://turnify.com',
      payer_email: '[EMAIL_ADDRESS]',
      external_reference: businessId,
    });

    const subscription = await this.subscriptionRepository.upsert(businessId, {
      business: { connect: { id: businessId } },
      plan: { connect: { id: plan.id } },
      status: 'PENDING_PAYMENT',
      amount: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      externalId: preapproval.id,
      paymentProvider: 'mercadopago',
      trialEndsAt: existingSubscription?.trialEndsAt,
      trialUsedAt: existingSubscription?.trialUsedAt,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      nextPaymentDate: null,
    });

    return {
      subscription,
      checkoutUrl: preapproval.init_point,
    };
  }

  /**
   * Cancel subscription
   */

  async cancelSubscription(subscriptionId: string, reason?: string) {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.externalId) {
      try {
        await this.mercadoPagoService.updateSubscriptionStatus(subscription.externalId, 'cancelled');
      } catch (error) {
        console.log('Error cancelling subscription in Mercado Pago', error);
      }
    }

    // update in db
    const cancelled = await this.subscriptionRepository.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        plan: true,
        business: true,
      },
    });

    await this.downgradeToFree(subscription.businessId);

    return cancelled;
  }

  /**
   * Downgrade to plan FREE
   */

  async downgradeToFree(businessId: string) {
    const freePlan = await this.plansService.findFreePlan();

    return await this.subscriptionRepository.update({
      where: { businessId },
      data: {
        planId: freePlan.id,
        status: 'ACTIVE',
        amount: freePlan.price,
        currency: freePlan.currency,
        billingCycle: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        nextPaymentDate: null,
        externalId: null,
      },
      include: {
        plan: true,
        business: true,
      },
    });
  }

  async syncSubscriptionState(mpData: MercadoPagoPreapproval) {
    const businessId = mpData.external_reference;
    const subscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newStatus = this.calculateStatus(mpData, subscription);

    return await this.subscriptionRepository.update({
      where: { id: subscription.id },
      data: {
        externalId: mpData.id,
        status: newStatus,
        amount: mpData.auto_recurring.transaction_amount,
        nextPaymentDate: mpData.next_payment_date,
        currentPeriodEnd: mpData.next_payment_date,
        paymentProvider: 'MERCADO_PAGO',
        ...(mpData.status === 'cancelled' && { cancelledAt: new Date() }),
      },
      include: {
        plan: true,
        business: true,
      },
    });
  }

  private calculateStatus(mpData: MercadoPagoPreapproval, currentSub: Subscription) {
    const mpStatus = mpData.status;
    const now = new Date();

    if (mpStatus === 'cancelled') {
      return SubscriptionStatus.CANCELLED;
    }
    if (mpStatus === 'expired') {
      return SubscriptionStatus.EXPIRED;
    }
    if (mpStatus === 'pending') {
      return SubscriptionStatus.PENDING_PAYMENT;
    }
    if (mpStatus === 'paused') {
      return SubscriptionStatus.SUSPENDED;
    }

    if (mpStatus === 'authorized') {
      // 1. still period trial
      const hasTrial = currentSub.trialEndsAt && currentSub.trialEndsAt > now;

      // 2. Already paid
      const hasPaidSomething = (mpData.summarized.charged_quantity || 0) > 0;

      // 3. Has trial and doesn't paid something => still trial
      if (hasTrial && !hasPaidSomething) {
        return SubscriptionStatus.TRIAL;
      }

      // In any other case => active
      return SubscriptionStatus.ACTIVE;
    }

    // default
    return SubscriptionStatus.PENDING_PAYMENT;
  }
}
