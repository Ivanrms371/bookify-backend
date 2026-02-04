import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebhookLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(args: Prisma.WebhookLogCreateArgs) {
    return this.prisma.webhookLog.create(args);
  }

  async findUnique(args: Prisma.WebhookLogFindUniqueArgs) {
    return this.prisma.webhookLog.findUnique(args);
  }

  async findMany(args: Prisma.WebhookLogFindManyArgs) {
    return this.prisma.webhookLog.findMany(args);
  }

  async findFirst(args: Prisma.WebhookLogFindFirstArgs) {
    return this.prisma.webhookLog.findFirst(args);
  }

  async update(args: Prisma.WebhookLogUpdateArgs) {
    return this.prisma.webhookLog.update(args);
  }

  async upsert(args: Prisma.WebhookLogUpsertArgs) {
    return this.prisma.webhookLog.upsert(args);
  }

  async deleteMany(args: Prisma.WebhookLogDeleteManyArgs) {
    return this.prisma.webhookLog.deleteMany(args);
  }
}
