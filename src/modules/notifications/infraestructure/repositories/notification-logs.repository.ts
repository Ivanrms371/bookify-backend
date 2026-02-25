import { Injectable } from '@nestjs/common';
import { NotificationLogCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class NotificationLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSuccessLog(deliveryId: string) {
    return this.prisma.notificationLog.create({
      data: {
        delivery: { connect: { id: deliveryId } },
        status: 'SENT',
      },
    });
  }

  async createErrorLog(deliveryId: string, error: string) {
    return this.prisma.notificationLog.create({
      data: {
        delivery: { connect: { id: deliveryId } },
        status: 'FAILED',
        errorMessage: error,
      },
    });
  }
}
