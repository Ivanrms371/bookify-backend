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

  async getAppointmentsByEmployeeAndDate(employeeId: string, startOfDay: Date, endOfDay: Date) {
    return await this.db().appointment.findMany({
      where: {
        employeeId: employeeId,
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
        employee: {
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
        employeeId: true,
        status: true,
        customerId: true,
        serviceId: true,
        employee: {
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
        employee: {
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
    const { tenantId, status, employeeId, startDate, endDate, customerId, orderBy, order, skip = 0, take = 100 } = params;
    return this.db().appointment.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(employeeId && { employeeId }),
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
        employee: {
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

  findUpcomingDashboard(tenantId: string, employeeId?: string) {
    const now = new Date();
    return this.db().appointment.findMany({
      where: {
        tenantId,
        ...(employeeId && { employeeId }),
        status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
        startTime: { lte: endOfDay(now) },
        endTime: { gt: now },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      include: {
        employee: {
          select: { displayName: true },
        },
      },
    });
  }

  countUpcomingDashboard(tenantId: string, employeeId?: string) {
    const now = new Date();
    return this.db().appointment.count({
      where: {
        tenantId,
        ...(employeeId && { employeeId }),
        status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
        startTime: { lte: endOfDay(now) },
        endTime: { gt: now },
      },
    });
  }

  countAppointmentsInRange(tenantId: string, startDate: Date, endDate: Date, employeeId?: string) {
    return this.db().appointment.count({
      where: {
        tenantId,
        ...(employeeId && { employeeId }),
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
        employeeId: true,
        status: true,
        customerId: true,
        serviceId: true,
        employee: {
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
      employeeId: string;
      serviceId: string;
      startTime: Date;
      endTime: Date;
      durationMinutes: number;
      price: any;
      discountFixed: any;
      discountPercentage: any;
      rescheduleReason?: string;
    },
    blocks: { employeeId: string; startTime: Date; endTime: Date }[],
    tx?: TransactionClient,
  ) {
    const db = this.db(tx);

    const updated = await db.appointment.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
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
          employeeId: b.employeeId,
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
