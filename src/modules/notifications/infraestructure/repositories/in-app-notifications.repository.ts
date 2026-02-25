import { Injectable } from '@nestjs/common';
import { InAppNotificationCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InAppNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: InAppNotificationCreateInput) {
    return this.prisma.inAppNotification.create({ data });
  }
}
