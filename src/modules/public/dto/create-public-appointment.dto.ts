import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { CreatePublicParams } from 'src/modules/appointments/appointments.types';

export class CreatePublicAppointmentDto implements CreatePublicParams {
  @IsUUID()
  customerId: string;

  @IsUUID()
  tenantId: string;

  @IsUUID()
  serviceId: string;

  @IsUUID()
  professionalId: string;

  @IsISO8601()
  startsAt: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
