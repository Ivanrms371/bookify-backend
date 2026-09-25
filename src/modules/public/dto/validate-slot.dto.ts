import { IsISO8601, IsNotEmpty, IsUUID } from 'class-validator';
import { ValidateSlotAvailabilityParams } from 'src/modules/availability/types/availability.types';

export class ValidateSlotAvailabilityDto implements ValidateSlotAvailabilityParams {
  @IsUUID('7', { message: 'tenantId debe ser un UUID válido' })
  @IsNotEmpty()
  tenantId: string;

  @IsUUID('7', { message: 'El serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El serviceId es obligatorio.' })
  serviceId: string;

  @IsUUID('7', { message: 'El professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El professionalId es obligatorio.' })
  professionalId: string;

  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;
}
