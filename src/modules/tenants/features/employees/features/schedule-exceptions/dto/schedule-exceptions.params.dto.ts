import { IsOptional, IsUUID } from 'class-validator';

export class TenantEmployeeParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  employeeId: string;
}

export class TenantEmployeeExceptionsParamsDto extends TenantEmployeeParamsDto {
  @IsUUID()
  exceptionId: string;
}
