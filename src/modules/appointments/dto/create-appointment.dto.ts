import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { parseISO } from 'date-fns';

export class CreateAppointmentDto {
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  professionalId: string;

  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;
}
