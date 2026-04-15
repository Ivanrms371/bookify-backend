import { IsOptional, IsUUID } from 'class-validator';

export class TenantStaffParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  staffId: string;
}

export class TenantStaffWorkingHoursParamsDto extends TenantStaffParamsDto {
  @IsUUID()
  workingHourId: string;
}
