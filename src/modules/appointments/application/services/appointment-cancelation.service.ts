import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import EventEmitter2 from 'eventemitter2';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';

@Injectable()
export class AppointmentCancelationService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async cancelAppointment(id: string) {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    await this.appointmentsRepository.markAsCancelled(appointment.id, 'Customer requested cancellation');

    this.eventEmitter.emit('appointment.cancelled', {
      tenantId: appointment.tenantId,
      appointmentId: appointment.id,
      staffId: appointment.staffId,
      staffName: appointment.staff.user.name,
      userId: appointment.staff.userId,
      customerId: appointment.customerId,
      customerName: appointment.customer.name,
      serviceId: appointment.serviceId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      cancellationReason: appointment.cancellationReason,
      cancelledAt: appointment.cancelledAt,
    } as AppointmentCancelledEvent);
  }

  async generateCancelUrl() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return {
      cancelUrl: `${process.env.APP_URL}/appointments/${rawToken}/cancel`,
      cancelToken: tokenHash,
    };
  }
}
