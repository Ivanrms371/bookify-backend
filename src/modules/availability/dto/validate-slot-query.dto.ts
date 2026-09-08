import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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

  @IsString({ message: 'startTime debe ser un string ISO 8601 válido.' })
  @IsNotEmpty({ message: 'startTime es obligatorio.' })
  startTime: string;
}
