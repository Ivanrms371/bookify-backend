import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentRescheduledEvent } from 'src/modules/appointments/domain/events/appointment-rescheduled.event';

@Injectable()
export class AppointmentRescheduledListener {
  constructor() {}

  @OnEvent('appointment.rescheduled', { async: true })
  handle(payload: AppointmentRescheduledEvent) {}
}
