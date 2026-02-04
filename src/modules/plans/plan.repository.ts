import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanStatusDto } from './dto/update-state.dto';
import { PlanUpdateInput } from 'src/generated/prisma/models';
import { Plan, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActives() {
    return this.prisma.plan.findMany({
      where: {
        isActive: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }

  findFreePlan() {
    return this.prisma.plan.findFirst({
      where: { name: 'Free' },
    });
  }

  // ---------- Commands ----------

  createWithLimits(data: Prisma.PlanCreateInput) {
    return this.prisma.plan.create({
      data: {
        ...data,
      },
    });
  }

  activatePlan(planId: string, externalReference: string): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id: planId },
      data: {
        externalReference,
        isActive: true,
      },
    });
  }
}
