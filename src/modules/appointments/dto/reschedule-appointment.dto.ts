import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;

  @IsString()
  @IsOptional()
  rescheduleReason?: string;
}
