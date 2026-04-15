import { IsObject, IsString, IsUUID } from 'class-validator';

class Customer {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  email: string;
}

class Appointment {
  @IsString()
  @IsUUID()
  tenantId: string;

  @IsString()
  @IsUUID()
  staffId: string;

  @IsString()
  @IsUUID()
  serviceId: string;

  @IsString()
  date: Date;
}

export class CreateAppointmentDto {
  @IsObject()
  customer: Customer;
  @IsObject()
  appointment: Appointment;
}
