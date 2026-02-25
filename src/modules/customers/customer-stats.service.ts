import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class CustomerStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementAppointmentsCount(customerId: string, appointmentAt: Date) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalAppointments: { increment: 1 },
        firstAppointmentAt: customer?.firstAppointmentAt ?? appointmentAt,
        nextAppointmentAt: appointmentAt,
      },
    });
  }
}
