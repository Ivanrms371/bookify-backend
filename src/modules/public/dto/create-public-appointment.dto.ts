import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { parseISO } from 'date-fns';
import { CreatePublicParams } from 'src/modules/appointments/appointments.types';

export class CreatePublicAppointmentDto implements CreatePublicParams {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsUUID()
  @IsNotEmpty()
  professionalId: string;

  @IsISO8601()
  @IsNotEmpty()
  startsAt: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhoneCode: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
