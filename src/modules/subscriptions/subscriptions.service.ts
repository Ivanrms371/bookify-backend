import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from '../plans/plans.service';
import { Plan, SubscriptionStatus } from 'src/generated/prisma/client';
import { addMonths } from 'date-fns';
import { StartSubscriptionDto } from './dto/start-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansService: PlansService,
  ) {}

  async start({ planId, tenantId }: StartSubscriptionDto) {
    const plan = await this.plansService.findById(planId);

    const existing = await this.subscriptionsRepository.findByTenantId(tenantId);
    if (existing) {
      throw new ConflictException('No puedes empezar un nuevo plan si tienes una suscripción activa');
    }
    if (this.plansService.isFree(plan)) {
      return this.startFree(tenantId, plan);
    }

    return this.startTrial(tenantId, plan);
  }

  async startFree(tenantId: string, plan: Plan) {
    return this.subscriptionsRepository.create({
      tenant: { connect: { id: tenantId } },
      plan: { connect: { id: plan.id } },
      amount: plan.price,
      currentPeriodStart: new Date(),
      currency: plan.currency,
      status: SubscriptionStatus.ACTIVE,
    });
  }

  async startTrial(tenantId: string, plan: Plan) {
    const trialEndsAt = addMonths(new Date(), plan.trialDays);
    return this.subscriptionsRepository.create({
      tenant: { connect: { id: tenantId } },
      plan: { connect: { id: plan.id } },
      amount: plan.price,
      billingCycle: plan.billingCycle,
      currency: plan.currency,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
      nextPaymentDate: trialEndsAt,
      trialStartedAt: new Date(),
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    });
  }
}
