import { Injectable, Logger } from '@nestjs/common';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AppointmentStatsService } from '../services/appointment-stats.service';

@Injectable()
export class AppointmentCompletationScheduler {
  private readonly logger = new Logger(AppointmentCompletationScheduler.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentStats: AppointmentStatsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run() {
    this.logger.log('Auto-completting Appointments');

    const expired = await this.appointmentsRepository.findExpiredConfirmed();

    for (const appointment of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: { status: 'COMPLETED' },
        });

        await this.appointmentStats.onCompleted(
          {
            customerId: appointment.customerId,
            revenue: appointment.price,
            employeeId: appointment.employeeId,
            startTime: appointment.startTime,
            tenantId: appointment.tenantId,
            previousStatus: appointment.status,
          },
          tx,
        );
      });
    }
  }
}
