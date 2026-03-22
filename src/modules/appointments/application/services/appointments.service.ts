import { AppointmentStatus } from 'src/generated/prisma/enums';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';

export class AppointmentsService {
  constructor(private readonly appointmentsRepository: AppointmentsRepository) {}

  findUpcomingByBusiness(businessId: string) {
    return this.appointmentsRepository.findAllByBusiness(businessId, {
      upcoming: true,
      limit: 10,
      status: AppointmentStatus.CONFIRMED,
    });
  }
}
