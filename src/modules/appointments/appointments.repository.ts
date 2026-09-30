import { Injectable } from '@nestjs/common';
import { AppointmentCreateInput, AppointmentUpdateInput, AppointmentWhereInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { startOfDay, endOfDay } from 'date-fns';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class AppointmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(tenantId: string, params: FindAllAppointmentsParamsDto) {
    const { orderBy, order, skip = 0, take = 10, professionalId, date } = params;

    const where: AppointmentWhereInput = {
      tenantId,
      ...(professionalId ? { professionalId } : {}),
      ...(date ? { startsAt: { gte: startOfDay(date), lte: endOfDay(date) } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: orderBy ? { [orderBy]: order || 'asc' } : { startsAt: 'asc' },
        skip,
        take,
        select: {
          id: true,
          serviceId: true,
          customerId: true,
          professionalId: true,
          status: true,
          startsAt: true,
          endsAt: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          notes: true,
          internalNotes: true,
          manageToken: true,
          price: true,
          discountAmount: true,
          discountFixed: true,
          discountPercentage: true,
          durationMinutes: true,
          professional: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              bio: true,
              user: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
              imageUrl: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            userId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async create(data: AppointmentCreateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.create({ data });
  }

  async update() {}

  async cancel(tenantId: string, id: string, data: AppointmentUpdateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.update({
      where: { id, tenantId },
      data: {
        ...data,
        blocks: {
          deleteMany: {},
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
            userId: true,
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async count(tenantId: string, where: AppointmentWhereInput) {
    return this.prisma.appointment.count({ where: { ...where, tenantId } });
  }
}
