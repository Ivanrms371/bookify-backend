import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReschedulePublicParams } from 'src/modules/appointments/appointments.types';

export class ReschedulePublicAppointmentDto implements ReschedulePublicParams {
  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;

  @IsString()
  @IsOptional()
  rescheduleReason?: string;
}
