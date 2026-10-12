import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ProfessionalSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCandidates(afterId?: string, limit = 100) {
    return this.prisma.professional.findMany({
      where: { isActive: true, deletedAt: null, tenant: { isActive: true, deletedAt: null }, ...(afterId ? { id: { gt: afterId } } : {}) },
      orderBy: { id: 'asc' },
      take: limit,
      select: {
        id: true,
        tenantId: true,
        name: true,
        workingHours: { select: { dayOfWeek: true, opensAt: true, closesAt: true } },
        user: { select: { memberships: { where: { isActive: true }, select: { tenantId: true } } } },
        tenant: {
          select: {
            slug: true,
            settings: { select: { timeZone: true, currency: true } },
            tenantWorkingHours: { select: { dayOfWeek: true, opensAt: true, closesAt: true } },
          },
        },
      },
    });
  }

  findExceptions(tenantId: string, professionalId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.scheduleException.findMany({
      where: {
        tenantId,
        startDate: { lt: dayEnd },
        endDate: { gte: dayStart },
        OR: [{ professionals: { none: {} } }, { professionals: { some: { professionalId } } }],
      },
      select: { startDate: true, endDate: true, isClosed: true, blocks: { select: { opensAt: true, closesAt: true } } },
    });
  }

  getDayOutcomes(tenantId: string, professionalId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.appointment.groupBy({
      by: ['status'],
      where: { tenantId, professionalId, startsAt: { gte: dayStart, lt: dayEnd } },
      _count: { _all: true },
      _sum: { price: true, discountAmount: true },
      _max: { endsAt: true },
    });
  }

  getAgenda(tenantId: string, professionalId: string, dayStart: Date, dayEnd: Date) {
    return this.prisma.appointment.aggregate({
      where: { tenantId, professionalId, startsAt: { gte: dayStart, lt: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
      _count: { _all: true },
      _min: { startsAt: true },
    });
  }
}
