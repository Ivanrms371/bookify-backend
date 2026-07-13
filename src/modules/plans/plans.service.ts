import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlansRepository } from './plans.repository';
import { MercadoPagoService } from 'src/shared/integrations/mercadopago/mercadopago.service';
import { Plan, PlanType } from 'src/generated/prisma/client';
import { PublicPlan } from './plans.types';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  isFree(plan: Plan) {
    return plan.id === 'free';
  }

  async findAll(): Promise<PublicPlan[]> {
    return this.plansRepository.findAll();
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return plan;
  }
}
