import { Injectable } from '@nestjs/common';
import { NotificationStatus } from 'src/generated/prisma/enums';
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

  async createMany(data: NotificationCreateInput[]) {
    return this.prisma.notification.createMany({
      data,
    });
  }
}
