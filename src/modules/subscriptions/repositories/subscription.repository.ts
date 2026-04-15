import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Tenant, Plan, Prisma } from 'src/generated/prisma/client';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  SubscriptionCreateInput,
  SubscriptionFindFirstArgs,
  SubscriptionFindUniqueArgs,
  SubscriptionUpsertArgs,
} from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class SubscriptionRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private readonly thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  async findUnique<T extends Prisma.SubscriptionFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.SubscriptionFindUniqueArgs>,
    tx?: TransactionClient,
  ) {
    return this.db(tx).subscription.findUnique(args);
  }

  async findById(id: string, tx?: TransactionClient) {
    return this.db(tx).subscription.findUnique({ where: { id } });
  }

  async findByTenantId(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).subscription.findUnique({ where: { tenantId } });
  }

  async findWithPlanByTenantId(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
  }

  async findFirst(args: SubscriptionFindFirstArgs, tx?: TransactionClient) {
    return this.db(tx).subscription.findFirst(args);
  }

  async create(data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.db(tx).subscription.create({ data });
  }

  async createInitialSubscription(data: SubscriptionCreateInput, tx?: Prisma.TransactionClient) {
    return this.db(tx).subscription.create({ data });
  }

  async update(args: Prisma.SubscriptionUpdateArgs, tx?: TransactionClient) {
    return this.db(tx).subscription.update(args);
  }

  async upsert(tenantId: string, data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.db(tx).subscription.upsert({
      where: {
        tenantId,
      },
      create: data,
      update: data,
    });
  }

  async findSubscriptionsForLifecycle(dates: { start: Date; end: Date }[]) {
    return this.prisma.subscription.findMany({
      where: {
        OR: dates.flatMap((filter) => [
          {
            status: 'TRIAL',
            trialEndsAt: { gte: filter.start, lte: filter.end },
          },
          {
            status: 'ACTIVE',
            nextPaymentDate: { gte: filter.start, lte: filter.end },
          },
        ]),
      },
      include: {
        plan: true,
      },
    });
  }
}
