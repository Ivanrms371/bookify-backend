import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import { endOfDay } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(private readonly appointmentsRepository: AppointmentsRepository) {}

  findUpcomingByTenant(tenantId: string) {
    const now = new Date();
    const startDate = now;
    const endDate = endOfDay(now);
    return this.appointmentsRepository.findManyByTenant({
      tenantId,
      startDate,
      endDate,
      status: AppointmentStatus.CONFIRMED,
      orderBy: 'startTime',
      order: 'asc',
      skip: 0,
      take: 15,
    });
  }

  getDashboardUpcoming(tenantId: string, staffId?: string) {
    return this.appointmentsRepository.findUpcomingDashboard(tenantId, staffId);
  }

  countDashboardTodayAppointments(tenantId: string, startDate: Date, endDate: Date, staffId?: string) {
    return this.appointmentsRepository.countAppointmentsInRange(tenantId, startDate, endDate, staffId);
  }
}
