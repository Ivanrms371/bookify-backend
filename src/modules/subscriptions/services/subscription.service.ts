import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanService } from 'src/modules/plans/plan.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { MercadoPagoService } from 'src/mercadopago/mercadopago.service';
import { generateEndDate } from 'src/common/utils/dates.util';
import { addDays } from 'date-fns';
import { MercadoPagoPreapproval } from 'src/mercadopago/types/preapproval-subscription.type';
import { SubscriptionStatus } from 'src/generated/prisma/enums';
import { BusinessService } from 'src/modules/businesses/services/business.service';
import { Subscription } from 'src/generated/prisma/client';
import { BusinessOnboardingService } from 'src/modules/businesses/services/business-onboarding.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboardingService: BusinessOnboardingService,
    private readonly businessService: BusinessService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planService: PlanService,
  ) {}

  async findSubscriptionByBusinessId(businessId: string) {
    const subscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async createFreeSubscription(businessId: string) {
    const existingSubscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });

    if (existingSubscription) {
      throw new BadRequestException('Este negocio ya tiene una suscripción.');
    }

    const freePlan = await this.planService.findFreePlan();

    const subscription = await this.prisma.$transaction(async (tx) => {
      const subscription = await this.subscriptionRepository.create({
        data: {
          businessId,
          planId: freePlan.id,
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
        include: {
          plan: true,
          business: true,
        },
      });

      await this.onboardingService.markOnboardingAsCompleted(businessId, tx);

      return subscription;
    });

    return subscription;
  }

  async startTrial(businessId: string, planId: string) {
    const existingSubscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });

    if (existingSubscription) {
      throw new BadRequestException('Este negocio ya tiene una suscripción.');
    }

    const plan = await this.planService.findPlanById(planId);

    const trialEndsAt = addDays(new Date(), plan.trialDays);

    const subscription = await this.subscriptionRepository.upsert({
      where: { businessId },
      create: {
        businessId,
        planId: plan.id,
        status: 'TRIAL',
        amount: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        nextPaymentDate: trialEndsAt,
        trialEndsAt,
        trialUsedAt: new Date(),
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        amount: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        nextPaymentDate: trialEndsAt,
        trialEndsAt,
        trialUsedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    // TODO: Program emails reminder of trial
    // await this.scheduleTrialReminders(subscription);

    return subscription;
  }

  async createPaidSubscription(businessId: string, planId: string) {
    const plan = await this.planService.findPlanById(planId);

    if (this.planService.isFreePlan(plan)) {
      throw new BadRequestException('Este plan es gratuito.');
    }

    const business = await this.businessService.findBusinessById(businessId);

    const existingSubscription = await this.subscriptionRepository.findUnique({
      where: { businessId },
    });

    // frequency in base billin cycle
    const frequency = plan.billingCycle === 'MONTHLY' ? 1 : 12;
    const frequencyType = plan.billingCycle === 'MONTHLY' ? 'months' : 'years';

    // create preapproval (subscription) in mercadopago
    const preapproval = await this.mercadoPagoService.createSubscription({
      reason: `Plan ${plan.name} - Turnify`,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: plan.price.toNumber(),
        currency_id: plan.currency,
        start_date: new Date().toISOString(),
        end_date: generateEndDate().toISOString(),
      },
      back_url: 'https://turnify.com',
      payer_email: '[EMAIL_ADDRESS]',
      external_reference: businessId,
    });

    const subscription = await this.subscriptionRepository.upsert({
      where: { businessId },
      create: {
        businessId,
        planId: plan.id,
        status: 'PENDING_PAYMENT',
        amount: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        externalId: preapproval.id,
        paymentProvider: 'mercadopago',
        trialEndsAt: existingSubscription?.trialEndsAt,
        trialUsedAt: existingSubscription?.trialUsedAt,
      },
      update: {
        planId: plan.id,
        status: 'PENDING_PAYMENT',
        amount: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        externalId: preapproval.id,
        paymentProvider: 'mercadopago',
      },
      include: {
        plan: true,
        business: true,
      },
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
    const subscription = await this.subscriptionRepository.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.externalId) {
      try {
        await this.mercadoPagoService.updateSubscriptionStatus(
          subscription.externalId,
          'cancelled',
        );
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
    const freePlan = await this.planService.findFreePlan();

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
