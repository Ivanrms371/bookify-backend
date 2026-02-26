import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledEvent } from 'src/modules/appointments/domain/events/appointment-cancelled.event';

@Injectable()
export class AppointmentCancelledListener {
  constructor() {}

  @OnEvent('appointment.cancelled', { async: true })
  handle(payload: AppointmentCancelledEvent) {}
}
