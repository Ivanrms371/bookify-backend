import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';

@Injectable()
export class AppointmentReschedulingService {
  constructor(private readonly appointmentsRepository: AppointmentsRepository) {}

  async generateRescheduleUrl(appointmentId: string) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.appointmentsRepository.updateCancelToken(appointmentId, tokenHash);
    return `${process.env.FRONTEND_URL}/appointments/${appointmentId}/reschedule?token=${rawToken}`;
  }
}
