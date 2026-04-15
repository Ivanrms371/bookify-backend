import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  @IsUUID()
  staffId: string;

  @IsString()
  @IsUUID()
  serviceId: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
