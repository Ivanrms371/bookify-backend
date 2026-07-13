import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Plan, PlanType, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.plan.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        tagline: true,
        billingCycle: true,
        trialDays: true,
        price: true,
        compareAtPrice: true,
        currency: true,
        isPublic: true,
        isFeatured: true,
        sortOrder: true,
        description: true,
        features: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }
}
