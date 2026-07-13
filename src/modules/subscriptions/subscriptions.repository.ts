import { Injectable } from '@nestjs/common';
import { SubscriptionCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: SubscriptionCreateInput) {
    return this.prisma.subscription.create({ data });
  }

  async findByTenantId(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
    });
  }
}
