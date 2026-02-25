import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementDailyAppointments(businessId: string, date: Date) {
    const day = startOfDay(date);
    await this.prisma.businessDailyStats.upsert({
      where: { businessId_date: { businessId, date: day } },
      update: { appointments: { increment: 1 } },
      create: { businessId, date: day, appointments: 1 },
    });
  }

  async incrementLifetimeAppointments(businessId: string) {
    await this.prisma.businessLifetimeStats.upsert({
      where: { businessId },
      update: { totalAppointments: { increment: 1 } },
      create: { businessId, totalAppointments: 1, totalRevenue: 0, totalCustomers: 0 },
    });
  }
}
