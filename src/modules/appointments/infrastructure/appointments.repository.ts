import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AppointmentCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { endOfDay } from 'date-fns';
import { FindManyAppointmentsParams } from '../domain/types/find-many-appointments.type';

@Injectable()
export class AppointmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAppointmentsByStaffAndDate(staffId: string, startOfDay: Date, endOfDay: Date) {
    return await this.db().appointment.findMany({
      where: {
        staffId: staffId,
        status: { not: 'CANCELLED' },
        OR: [
          { startTime: { gte: startOfDay, lt: endOfDay } },
          { endTime: { gt: startOfDay, lte: endOfDay } },
          { AND: [{ startTime: { lte: startOfDay } }, { endTime: { gte: endOfDay } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findExpiredConfirmed() {
    return await this.db().appointment.findMany({
      where: {
        status: 'CONFIRMED',
        endTime: { lt: new Date() },
      },
      take: 100,
    });
  }

  create(appointment: AppointmentCreateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.create({
      data: appointment,
      include: {
        staff: {
          include: {
            user: true,
          },
        },
        customer: true,
        service: true,
      },
    });
  }

  findById(id: string) {
    return this.db().appointment.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        staffId: true,
        status: true,
        customerId: true,
        serviceId: true,
        staff: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        startTime: true,
        endTime: true,
        cancellationReason: true,
        cancelledAt: true,
      },
    });
  }

  findByIdForTenant(tenantId: string, appointmentId: string) {
    return this.db().appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        customerId: true,
        confirmationCode: true,
        notes: true,
        price: true,
        staff: {
          select: {
            id: true,
            displayName: true,
            colorTheme: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
          },
        },
        customer: {
          select: {
            totalAppointments: true,
            completedAppointments: true,
            cancelledAppointments: true,
            noShowCount: true,
          },
        },
      },
    });
  }

  findManyByTenant(params: FindManyAppointmentsParams) {
    const { tenantId, status, staffId, startDate, endDate, customerId, orderBy, order, skip = 0, take = 100 } = params;
    return this.db().appointment.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(staffId && { staffId }),
        ...(startDate || endDate
          ? {
              startTime: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
        customerName: true,
        confirmationCode: true,
        staff: {
          select: {
            id: true,
            displayName: true,
            colorTheme: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { [orderBy ?? 'startTime']: order ?? 'asc' },
      skip,
      take,
    });
  }

  findUpcomingDashboard(tenantId: string, staffId?: string) {
    const now = new Date();
    return this.db().appointment.findMany({
      where: {
        tenantId,
        ...(staffId && { staffId }),
        status: { not: 'CANCELLED' },
        startTime: { gte: now },
        endTime: { lte: endOfDay(now) },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      include: {
        staff: {
          select: { displayName: true },
        },
      },
    });
  }

  countAppointmentsInRange(tenantId: string, startDate: Date, endDate: Date, staffId?: string) {
    return this.db().appointment.count({
      where: {
        tenantId,
        ...(staffId && { staffId }),
        status: { not: 'CANCELLED' },
        startTime: { gte: startDate, lte: endDate },
      },
    });
  }

  updateCancelToken(id: string, token: string, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id },
      data: {
        cancelToken: token,
      },
    });
  }

  findByCancelToken(cancelToken: string) {
    return this.db().appointment.findUnique({
      where: { cancelToken },
      select: {
        id: true,
        staffId: true,
        status: true,
        customerId: true,
        serviceId: true,
        staff: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        startTime: true,
        endTime: true,
        cancellationReason: true,
        cancelledAt: true,
      },
    });
  }

  markAsCancelled(id: string, reason: string | null = null, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelToken: null,
      },
    });
  }

  markAsNoShow(id: string, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
      },
    });
  }

  async reschedule(
    id: string,
    data: {
      staffId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
      durationMinutes: number;
      initialActiveMinutes: number;
      passiveMinutes: number;
      finalActiveMinutes: number;
      price: any;
      discountFixed: any;
      discountPercentage: any;
      rescheduleReason?: string;
    },
    blocks: { staffId: string; startTime: Date; endTime: Date }[],
    tx?: TransactionClient,
  ) {
    const db = this.db(tx);

    const updated = await db.appointment.update({
      where: { id },
      data: {
        staffId: data.staffId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        initialActiveMinutes: data.initialActiveMinutes,
        passiveMinutes: data.passiveMinutes,
        finalActiveMinutes: data.finalActiveMinutes,
        price: data.price,
        discountFixed: data.discountFixed,
        discountPercentage: data.discountPercentage,
        rescheduleCount: { increment: 1 },
        rescheduleReason: data.rescheduleReason ?? null,
        rescheduleRequestedAt: new Date(),
        status: 'CONFIRMED',
      },
    });

    await db.appointmentBlock.deleteMany({
      where: { appointmentId: id },
    });

    if (blocks.length > 0) {
      await db.appointmentBlock.createMany({
        data: blocks.map((b) => ({
          appointmentId: id,
          staffId: b.staffId,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });
    }

    return updated;
  }

  updateRescheduleToken(id: string, token: string, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id },
      data: {
        rescheduleToken: token,
      },
    });
  }
}
