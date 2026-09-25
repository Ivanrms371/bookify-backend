import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { parseISO } from 'date-fns';

export class ValidateSlotQueryDto {
  @IsUUID('7', { message: 'tenantId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'tenantId es obligatorio.' })
  tenantId: string;

  @IsUUID('7', { message: 'professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'professionalId es obligatorio.' })
  professionalId: string;

  @IsUUID('7', { message: 'serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'serviceId es obligatorio.' })
  serviceId: string;

  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;
}
