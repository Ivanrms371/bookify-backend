import { IsOptional, IsUUID } from 'class-validator';

export class BusinessStaffParamsDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  staffId: string;
}

export class BusinessStaffWorkingHoursParamsDto extends BusinessStaffParamsDto {
  @IsUUID()
  workingHourId: string;
}

export class BusinessStaffExceptionsParamsDto extends BusinessStaffParamsDto {
  @IsUUID()
  exceptionId: string;
}
