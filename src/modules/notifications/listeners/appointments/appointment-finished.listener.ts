import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../application/services/notifications.service';
import type { AppointmentFinishedEvent } from 'src/modules/appointments/domain/events/appointment-finished.event';

@Injectable()
export class AppointmentFinishedListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent('appointment.finished', { async: true })
  async handle(event: AppointmentFinishedEvent) {
    await this.notifications.cancelScheduledDeliveries(event.appointmentId, 'appointment.reminder');
  }
}
