import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Business, Plan, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  async findUnique(args: Prisma.SubscriptionFindUniqueArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.subscription.findUnique(args);
  }

  async findFirst(args: Prisma.SubscriptionFindFirstArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.subscription.findFirst(args);
  }

  async create(args: Prisma.SubscriptionCreateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.subscription.create(args);
  }

  async update(args: Prisma.SubscriptionUpdateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.subscription.update(args);
  }

  async upsert(args: Prisma.SubscriptionUpsertArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.subscription.upsert(args);
  }
}
