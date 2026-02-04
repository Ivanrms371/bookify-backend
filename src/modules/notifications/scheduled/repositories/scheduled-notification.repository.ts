import { ScheduledNotificationCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

export class ScheduledNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ScheduledNotificationCreateInput) {
    return this.prisma.scheduledNotification.create({ data });
  }

  async findPendingToSend(now: Date, limit: number = 100) {
    return await this.prisma.scheduledNotification.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit,
    });
  }

  async markAsSent(id: string) {
    return this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, error: string) {
    return this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
      },
    });
  }

  async incrementRetry(id: string) {
    return this.prisma.scheduledNotification.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
      },
    });
  }

  async cancelByAppointment(appointmentId: string) {
    const result = await this.prisma.scheduledNotification.updateMany({
      where: {
        appointmentId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });
    return result.count;
  }

  async deleteOld(beforeDate: Date) {
    const result = await this.prisma.scheduledNotification.deleteMany({
      where: {
        status: {
          in: ['SENT', 'FAILED', 'CANCELLED'],
        },
        scheduledFor: { lt: beforeDate },
      },
    });
    return result.count;
  }
}
