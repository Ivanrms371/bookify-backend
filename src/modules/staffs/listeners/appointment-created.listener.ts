import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { StaffStatsService } from 'src/modules/staffs/features/stats/staff-stats.service';

@Injectable()
export class AppointmentCreatedListener {
  constructor(private readonly staffStatsService: StaffStatsService) {}

  @OnEvent('appointment.created', { async: true })
  handle(payload: AppointmentCreatedEvent) {
    const { staffId, startAppointmentDate } = payload;

    this.staffStatsService.incrementDailyAppointments(staffId, startAppointmentDate);
  }
}
