import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlansRepository } from './plans.repository';
import { MercadoPagoService } from 'src/mercadopago/mercadopago.service';
import { Plan, PlanType } from 'src/generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  isFreePlan(plan: Plan) {
    return plan.price.isZero();
  }

  async findAllPlans() {
    return this.plansRepository.findAllActives();
  }

  async findPlanById(id: string) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }

  async findPlanByKey(key: PlanType) {
    const plan = await this.plansRepository.findByKey(key);
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }

  async findFreePlan() {
    const freePlan = await this.plansRepository.findFreePlan();
    if (!freePlan) {
      throw new NotFoundException('Free plan not found');
    }
    return freePlan;
  }

  async createPlan(data: CreatePlanDto) {
    const { limits, ...planData } = data;
    const plan = await this.plansRepository.createWithLimits({
      ...planData,
      limits: {
        create: limits,
      },
    });

    try {
      const mpPlan = await this.mercadoPagoService.createSubscriptionPlan({
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: data.price,
          currency_id: 'UYU',
        },
        reason: plan.name,
        back_url: 'https://turnify.com',
        external_reference: plan.id,
        status: 'active',
      });
      return this.plansRepository.activatePlan(plan.id, mpPlan.id);
    } catch (error) {
      console.log(error);
    }
  }
}
