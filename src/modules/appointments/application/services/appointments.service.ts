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

  getDashboardUpcoming(tenantId: string, employeeId?: string) {
    return this.appointmentsRepository.findUpcomingDashboard(tenantId, employeeId);
  }

  countDashboardUpcomingAppointments(tenantId: string, employeeId?: string) {
    return this.appointmentsRepository.countUpcomingDashboard(tenantId, employeeId);
  }

  getUpcoming(tenantId: string, employeeId?: string, take: number = 10) {
    const today = new Date();
    const startDate = today;
    const endDate = endOfDay(today);
    return this.appointmentsRepository.findManyByTenant({
      tenantId,
      employeeId,
      startDate,
      endDate,
      status: AppointmentStatus.CONFIRMED,
      orderBy: 'startTime',
      order: 'asc',
      skip: 0,
      take,
    });
  }
}
