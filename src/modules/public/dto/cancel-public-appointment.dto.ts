import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CancelPublicParams, ReschedulePublicParams } from 'src/modules/appointments/appointments.types';

export class CancelPublicAppointmentDto implements CancelPublicParams {
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
