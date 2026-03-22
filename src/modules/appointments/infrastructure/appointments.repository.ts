import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AppointmentCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindBusinessAppointmentsFilters } from '../domain/appointment.types';
import { startTransition } from 'react';

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
        businessId: true,
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

  findAllByBusiness(
    businessId: string,
    { status, staffId, customerId, upcoming, startDate, endDate, limit, offset }: FindBusinessAppointmentsFilters,
  ) {
    return this.db().appointment.findMany({
      where: {
        businessId,
        ...(status && { status }),
        ...(staffId && { staffId }),
        ...(customerId && { customerId }),
        ...(upcoming && {
          startTime: { gte: new Date() },
        }),
        ...(startDate || endDate
          ? {
              startTime: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { startTime: 'asc' },
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
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

  markAsCancelled(id: string, reason: string, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });
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
