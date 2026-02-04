import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlanRepository } from './plan.repository';
import { UpdatePlanStatusDto } from './dto/update-state.dto';
import { MercadoPagoService } from 'src/mercadopago/mercadopago.service';
import { generateEndDate } from 'src/common/utils/dates.util';
import { Plan } from 'src/generated/prisma/client';

@Injectable()
export class PlanService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  isFreePlan(plan: Plan) {
    return plan.price.isZero();
  }

  async findAllPlans() {
    return this.planRepository.findAllActives();
  }

  async findPlanById(id: string) {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }

  async findFreePlan() {
    const freePlan = await this.planRepository.findFreePlan();
    if (!freePlan) {
      throw new NotFoundException('Free plan not found');
    }
    return freePlan;
  }

  async createPlan(data: CreatePlanDto) {
    const { limits, ...planData } = data;
    const plan = await this.planRepository.createWithLimits({
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
      return this.planRepository.activatePlan(plan.id, mpPlan.id);
    } catch (error) {
      console.log(error);
    }
  }
}
