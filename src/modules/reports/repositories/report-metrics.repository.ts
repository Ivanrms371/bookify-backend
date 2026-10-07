import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';
import type { ReportFilterOptions, ReportOverviewData, ReportScope, ReportSettings, ReportAggregateQueryRow } from '../types/reports.types';
import { reportOverviewQuery } from './report-overview.query';

@Injectable()
export class ReportMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSettings(tenantId: string): Promise<ReportSettings | null> {
    return this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { timeZone: true, currency: true } });
  }

  async filtersBelongToTenant(scope: ReportScope): Promise<boolean> {
    const [professional, service] = await Promise.all([
      scope.professionalId ? this.prisma.professional.findFirst({ where: { id: scope.professionalId, tenantId: scope.tenantId }, select: { id: true } }) : true,
      scope.serviceId ? this.prisma.service.findFirst({ where: { id: scope.serviceId, tenantId: scope.tenantId }, select: { id: true } }) : true,
    ]);
    return Boolean(professional && service);
  }

  async findFilterOptions(tenantId: string): Promise<ReportFilterOptions> {
    const where = {
      tenantId,
      OR: [{ isActive: true, deletedAt: null }, { appointments: { some: { tenantId } } }],
    };
    const [services, professionals] = await Promise.all([
      this.prisma.service.findMany({ where, select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
      this.prisma.professional.findMany({ where, select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    ]);
    return { services, professionals };
  }

  async findReportAggregates(scope: ReportScope): Promise<ReportOverviewData> {
    const [result] = await this.prisma.$queryRaw<ReportAggregateQueryRow[]>(reportOverviewQuery(scope));
    return result.data;
  }

  /**
   * Returns tenant_daily_stats rows between startDate and endDate (inclusive),
   * ordered by date ascending. Both boundaries are treated as calendar-day boundaries.
   */
  async findDailyStatsByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Returns the single tenant_lifetime_stats row for the given tenant.
   */
  async findLifetimeStats(tenantId: string) {
    return this.prisma.tenantLifetimeStats.findUnique({
      where: { tenantId },
    });
  }

}
