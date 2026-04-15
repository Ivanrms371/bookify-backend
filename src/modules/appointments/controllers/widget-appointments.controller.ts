import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { WidgetAppointmentUseCase } from '../application/usecases/widget-appointment.usecase';
import { AppointmentCancelationService } from '../application/services/appointment-cancelation.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('appointments')
export class WidgetAppointmentsController {
  constructor(
    private readonly appointmentCreationUseCase: WidgetAppointmentUseCase,
    private readonly appointmentCancelationService: AppointmentCancelationService,
  ) {}

  @Public()
  @Post('')
  createAppointment(@Body() body: CreateAppointmentDto) {
    return this.appointmentCreationUseCase.execute(body);
  }

  @Delete(':id')
  cancelAppointment(@Param('id') id: string) {
    return this.appointmentCancelationService.cancelAppointment(id);
  }
}
