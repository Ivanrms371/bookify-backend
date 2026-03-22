import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';

@Injectable()
export class AppointmentReschedulingService {
  constructor(private readonly appointmentsRepository: AppointmentsRepository) {}

  async generateRescheduleUrl() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return {
      rescheduleUrl: `${process.env.FRONTEND_URL}/appointments/${rawToken}/reschedule`,
      rescheduleToken: tokenHash,
    };
  }
}
