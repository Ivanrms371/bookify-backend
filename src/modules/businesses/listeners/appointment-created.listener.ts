import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { BusinessQuotaService } from 'src/modules/businesses/features/quota/business-quota.service';
import { BusinessStatsService } from 'src/modules/businesses/features/stats/business-stats.service';

@Injectable()
export class AppointmentCreatedListener {
  constructor(
    private readonly businessStatsService: BusinessStatsService,
    private readonly businessQuotaService: BusinessQuotaService,
  ) {}

  @OnEvent('appointment.created', { async: true })
  async handle(payload: AppointmentCreatedEvent) {
    const { businessId, startAppointmentDate } = payload;
    await this.businessStatsService.incrementDailyAppointments(businessId, startAppointmentDate);

    await this.businessStatsService.incrementLifetimeAppointments(businessId);

    await this.businessQuotaService.incrementAppointmentsCount(businessId);
  }
}
