import { Injectable } from '@nestjs/common';
import { AppointmentCreateInput, AppointmentUpdateInput, AppointmentWhereInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BaseRepository } from 'src/common/database/base.repository';
import { AppointmentStatus, CreatedByType } from 'src/generated/prisma/enums';
import { AppointmentCancelInput } from './domain/types/appointment.types';

@Injectable()
export class AppointmentsPublicRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTokenForPublic(token: string) {
    return this.prisma.appointment.findUnique({
      where: { manageToken: token },
      select: {
        status: true,
        durationMinutes: true,
        price: true,
        notes: true,
        customerId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        manageToken: true,
        cancellationReason: true,
        cancelledAt: true,
        rescheduleCount: true,
        rescheduleReason: true,
        startsAt: true,
        endsAt: true,
        createdBy: true,
        tenant: {
          select: {
            name: true,
            description: true,
            phoneNumber: true,
            logoUrl: true,
            coverUrl: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            province: true,
            country: true,
          },
        },
        service: {
          select: {
            name: true,
            description: true,
          },
        },
        professional: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.appointment.findUnique({
      where: { manageToken: token },
      include: {
        service: { select: { durationMinutes: true } },
      },
    });
  }

  async create(data: AppointmentCreateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.create({ data: { ...data, createdBy: CreatedByType.CUSTOMER } });
  }

  async count(tenantId: string, where: AppointmentWhereInput) {
    return this.prisma.appointment.count({ where: { ...where, tenantId } });
  }

  async update(token: string, data: AppointmentUpdateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.update({ where: { manageToken: token }, data: { ...data, rescheduleCount: { increment: 1 } } });
  }

  async cancel(token: string, data: AppointmentCancelInput, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { manageToken: token },
      data: {
        cancellationReason: data.cancellationReason,
        cancelledAt: new Date(),
        status: AppointmentStatus.CANCELLED,
      },
    });
  }
}
