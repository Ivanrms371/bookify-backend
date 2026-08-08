import { Injectable } from '@nestjs/common';
import { AppointmentCreateInput, AppointmentWhereInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
              displayName: true,
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
              phone: true,
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

  async findById() {}

  async create(data: AppointmentCreateInput) {
    return this.prisma.appointment.create({ data });
  }

  async update() {}

  async cancel() {}
}
