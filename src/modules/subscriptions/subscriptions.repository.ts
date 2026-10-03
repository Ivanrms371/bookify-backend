import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { Subscription } from 'src/generated/prisma/client';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SubscriptionCreateInput, SubscriptionUpdateInput, SubscriptionUpdateManyMutationInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  getCheckoutTenant(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({ where: { id: tenantId }, select: { slug: true, workspaceType: true, deletedAt: true } });
  }

  async create(data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.db(tx).subscription.create({ data });
  }

  async ensureTrial(tenantId: string, data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.db(tx).subscription.upsert({ where: { tenantId }, create: data, update: {} });
  }

  async getResourceUsage(tenantId: string) {
    const [professionals, services] = await Promise.all([
      this.db().professional.count({ where: { tenantId, deletedAt: null } }),
      this.db().service.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { professionals, services, countBasis: 'non_deleted' as const };
  }

  async findByTenantId(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).subscription.findUnique({
      where: { tenantId },
    });
  }

  async findByLemonSubscriptionId(lemonSubscriptionId: string, tx?: TransactionClient): Promise<Subscription | null> {
    return this.db(tx).subscription.findUnique({
      where: { lemonSubscriptionId },
    });
  }

  attachProviderSubscription(
    tenantId: string,
    previousProviderId: string | null,
    data: SubscriptionUpdateManyMutationInput,
    tx?: TransactionClient,
  ) {
    return this.db(tx).subscription.updateMany({
      where: { tenantId, deletedAt: null, lemonSubscriptionId: previousProviderId },
      data,
    });
  }

  async updateByTenantId(tenantId: string, data: SubscriptionUpdateInput, tx?: TransactionClient): Promise<Subscription> {
    return this.db(tx).subscription.update({
      where: { tenantId },
      data,
    });
  }

  async updateByLemonSubscriptionId(
    lemonSubscriptionId: string,
    data: SubscriptionUpdateInput,
    tx?: TransactionClient,
  ): Promise<Subscription> {
    return this.db(tx).subscription.update({
      where: { lemonSubscriptionId },
      data,
    });
  }
}
