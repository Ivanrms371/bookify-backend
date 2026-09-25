import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { Subscription } from 'src/generated/prisma/client';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SubscriptionCreateInput, SubscriptionUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: SubscriptionCreateInput, tx?: TransactionClient) {
    return this.db(tx).subscription.create({ data });
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
