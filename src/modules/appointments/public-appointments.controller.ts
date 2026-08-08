import { Controller } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

@Controller('public/appointments')
export class PublicAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
}
