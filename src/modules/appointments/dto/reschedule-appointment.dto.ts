import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  @IsUUID()
  employeeId: string;

  @IsString()
  @IsUUID()
  serviceId: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
