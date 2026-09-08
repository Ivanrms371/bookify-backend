import { IsOptional, IsUUID } from 'class-validator';

export class TenantProfessionalParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  professionalId: string;
}

export class TenantProfessionalWorkingHoursParamsDto extends TenantProfessionalParamsDto {
  @IsUUID()
  workingHourId: string;
}
