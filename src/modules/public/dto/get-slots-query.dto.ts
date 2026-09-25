import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';
import { GetDayAvailabilityParams } from '../../availability/types/availability.types';

export class GetSlotsQueryDto implements GetDayAvailabilityParams {
  @IsUUID('7', { message: 'tenantId debe ser un UUID válido' })
  @IsNotEmpty()
  tenantId: string;

  @IsUUID('7', { message: 'professionalId debe ser un UUID válido' })
  @IsNotEmpty()
  professionalId: string;

  @IsUUID('7', { message: 'serviceId debe ser un UUID válido' })
  @IsNotEmpty()
  serviceId: string;

  @IsDateString({}, { message: 'date debe tener formato YYYY-MM-DD' })
  @IsNotEmpty()
  date: string;
}
