import { IsOptional, IsUUID } from 'class-validator';

export class TenantEmployeeParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  employeeId: string;
}

export class TenantEmployeeWorkingHoursParamsDto extends TenantEmployeeParamsDto {
  @IsUUID()
  workingHourId: string;
}
