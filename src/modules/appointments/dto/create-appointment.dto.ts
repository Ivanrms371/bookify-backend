import { IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  professionalId: string;

  @IsString()
  date: string;

  @IsString()
  time: string;
}
