import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { BusinessLimitsService } from 'src/modules/businesses/features/limits/business-limits.service';
import { BusinessStatsService } from 'src/modules/businesses/features/stats/business-stats.service';

@Injectable()
export class AppointmentCreatedListener {
  constructor(
    private readonly businessStatsService: BusinessStatsService,
    private readonly businessLimitsService: BusinessLimitsService,
  ) {}

  @OnEvent('appointment.created', { async: true })
  async handle(payload: AppointmentCreatedEvent) {
    const { businessId, startAppointmentDate } = payload;
    await this.businessStatsService.incrementDailyAppointments(businessId, startAppointmentDate);

    await this.businessStatsService.incrementLifetimeAppointments(businessId);

    await this.businessLimitsService.incrementAppointmentsCount(businessId);
  }
}
