import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Plan, PlanType, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PlansRepository {
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
      where: { planType: PlanType.FREE },
    });
  }

  findByKey(key: PlanType) {
    return this.prisma.plan.findFirst({
      where: { planType: key },
      include: {
        limits: true,
      },
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
