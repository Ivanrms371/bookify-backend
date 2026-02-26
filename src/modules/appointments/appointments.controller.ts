import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentCreationService } from './application/services/appointment-creation.service';
import { AppointmentCancelationService } from './application/services/appointment-cancelation.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentCreationService: AppointmentCreationService,
    private readonly appointmentCancelationService: AppointmentCancelationService,
  ) {}

  @Post('')
  createAppointment(@Body() body: CreateAppointmentDto) {
    return this.appointmentCreationService.createAppointment(body);
  }

  @Delete(':id')
  cancelAppointment(@Param('id') id: string) {
    return this.appointmentCancelationService.cancelAppointment(id);
  }
}
