import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class StaffStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementLifetimeAppointments(staffId: string) {
    return this.prisma.staffLifetimeStats.upsert({
      where: { staffId },
      create: { staffId, totalAppointments: 1 },
      update: { totalAppointments: { increment: 1 } },
    });
  }

  async incrementDailyAppointments(staffId: string, date: Date) {
    const day = startOfDay(date);

    return this.prisma.staffDailyStats.upsert({
      where: { staffId_date: { staffId, date: day } },
      create: { staffId, date: day, appointmentsCount: 1, newCustomersCount: 1 },
      update: { appointmentsCount: { increment: 1 } },
    });
  }
}
