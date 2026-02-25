import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from 'src/modules/appointments/domain/events/appointment-created.event';
import { CustomerStatsService } from 'src/modules/customers/customer-stats.service';

@Injectable()
export class AppointmentCreatedListener {
  constructor(private readonly customerStatsService: CustomerStatsService) {}

  @OnEvent('appointment.created', { async: true })
  async handle(payload: AppointmentCreatedEvent) {
    const { customerId, startAppointmentDate } = payload;

    await this.customerStatsService.incrementAppointmentsCount(customerId, startAppointmentDate);
  }
}
