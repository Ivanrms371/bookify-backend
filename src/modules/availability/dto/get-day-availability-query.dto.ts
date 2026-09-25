import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class GetDayAvailabilityQueryDto {
  @IsUUID('7', { message: 'tenantId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'tenantId es obligatorio.' })
  tenantId: string;

  @IsUUID('7', { message: 'professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'professionalId es obligatorio.' })
  professionalId: string;

  @IsUUID('7', { message: 'serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'serviceId es obligatorio.' })
  serviceId: string;

  @IsDateString({}, { message: 'date debe tener formato YYYY-MM-DD.' })
  @IsNotEmpty({ message: 'date es obligatorio.' })
  date: string;
}
