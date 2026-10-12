import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { NotificationOccurrenceInput } from '../../types/notification-occurrence.type';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';
import { Injectable } from '@nestjs/common';
import { NotificationCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NotificationCreateInput) {
    return this.prisma.notification.create({
      data,
    });
  }

  async createOccurrence(input: NotificationOccurrenceInput, channels: NotificationChannel[], tx?: TransactionClient) {
    if (tx) {
      // The onboarding caller holds the tenant lock. Replays preserve the first payload and channels.
      return tx.notification.upsert({
        where: { occurrenceKey: input.occurrenceKey },
        create: { ...input, deliveries: { create: channels.map((channel) => ({ channel })) } },
        update: {},
      });
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Nested creation and the unique key make the notification and all channels atomic.
        return tx.notification.create({
          data: { ...input, deliveries: { create: channels.map((channel) => ({ channel })) } },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.notification.findUnique({ where: { occurrenceKey: input.occurrenceKey } });
        if (existing) return null;
      }
      throw error;
    }
  }

  async createMany(data: NotificationCreateInput[]) {
    return this.prisma.notification.createMany({
      data,
    });
  }
}
