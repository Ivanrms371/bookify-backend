import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phase 1: Metadata and Base Entities
   * Brings the settings and verify that the professional offers the service.
   * Highly eligible for caching (In-Memory TTL corto).
   */
  async getConfigurationContext(tenantId: string, professionalId: string, serviceId: string) {
    const [settings, professional, service] = await Promise.all([
      this.prisma.tenantSettings.findUnique({
        where: { tenantId },
        select: {
          maxAdvancedDays: true,
          slotIntervalMinutes: true,
          minAdvancedMinutes: true,
          bufferTimeMinutes: true,
          timeZone: true,
        },
      }),

      this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          tenantId,
          isActive: true,
          deletedAt: null,
          assignments: {
            some: { serviceId, isActive: true },
          },
        },
        select: {
          maxAdvancedDays: true,
          slotIntervalMinutes: true,
          minAdvancedMinutes: true,
        },
      }),

      this.prisma.service.findFirst({
        where: {
          id: serviceId,
          tenantId,
          isActive: true,
          deletedAt: null,
        },
        select: { durationMinutes: true },
      }),
    ]);

    return { settings, professional, service };
  }

  /**
   * Phase 2: Timeline Transaction of the Day
   * It is always executed against the database to avoid collisions.
   * It directly uses the composite indexes of each table
   */
  async getTimelineForRange(params: { tenantId: string; professionalId: string; rangeStartUtc: Date; rangeEndUtc: Date }) {
    const { tenantId, professionalId, rangeStartUtc, rangeEndUtc } = params;

    const [tenantHours, professionalHours, exceptions, appointments] = await Promise.all([
      // Use @@index([tenantId, dayOfWeek])
      this.prisma.tenantWorkingHours.findMany({
        where: { tenantId },
        select: { opensAt: true, closesAt: true, dayOfWeek: true },
      }),

      // Use @@index([professionalId, dayOfWeek])
      this.prisma.professionalWorkingHours.findMany({
        where: { tenantId, professionalId },
        select: { opensAt: true, closesAt: true, dayOfWeek: true },
      }),

      // Use @@index([startDate, endDate])
      this.prisma.scheduleException.findMany({
        where: {
          tenantId,
          startDate: { lte: rangeEndUtc },
          endDate: { gte: rangeStartUtc },
          OR: [{ professionals: { none: {} } }, { professionals: { some: { professionalId } } }],
        },
        include: {
          blocks: {
            select: { opensAt: true, closesAt: true },
          },
        },
      }),

      // Use @@index([tenantId, professionalId, startsAt, endsAt])
      this.prisma.appointment.findMany({
        where: {
          tenantId,
          professionalId,
          status: { notIn: ['CANCELLED'] },
          startsAt: { lt: rangeEndUtc },
          endsAt: { gt: rangeStartUtc },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          blocks: {
            select: { startsAt: true, endsAt: true },
          },
        },
      }),
    ]);

    return {
      tenantHours,
      professionalHours,
      exceptions,
      appointments,
    };
  }

  /**
   * Atomic verification before inserting a new shift
   */
  async hasOverlappingAppointment(params: {
    tenantId: string;
    professionalId: string;
    startsAt: Date;
    endsAt: Date;
    excludeAppointmentId?: string;
  }): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        tenantId: params.tenantId,
        professionalId: params.professionalId,
        status: { notIn: ['CANCELLED'] },
        startsAt: { lt: params.endsAt },
        endsAt: { gt: params.startsAt },
        ...(params.excludeAppointmentId ? { id: { not: params.excludeAppointmentId } } : {}),
      },
    });

    return count > 0;
  }

  async hasOverlappingException(tenantId: string, professionalId: string, startsAt: Date, endsAt: Date): Promise<boolean> {
    const count = await this.prisma.scheduleException.count({
      where: {
        tenantId,
        startDate: { lte: endsAt },
        endDate: { gte: startsAt },
        OR: [{ professionals: { none: {} } }, { professionals: { some: { professionalId } } }],
      },
    });

    return count > 0;
  }
}
