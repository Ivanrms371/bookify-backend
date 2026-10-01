import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAppointmentAvailabilityQueryDto {
  @IsOptional()
  @IsUUID('7')
  excludeAppointmentId?: string;

  @IsUUID('7', { message: 'professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'professionalId es obligatorio.' })
  professionalId: string;

  @IsUUID('7', { message: 'serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'serviceId es obligatorio.' })
  serviceId: string;

  @IsDateString({}, { message: 'startDate debe tener formato YYYY-MM-DD.' })
  @IsNotEmpty({ message: 'startDate es obligatorio.' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate debe tener formato YYYY-MM-DD.' })
  endDate?: string;
}
