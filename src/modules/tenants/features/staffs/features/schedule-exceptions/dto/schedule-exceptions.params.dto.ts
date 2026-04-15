import { IsOptional, IsUUID } from 'class-validator';

export class TenantStaffParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  staffId: string;
}

export class TenantStaffExceptionsParamsDto extends TenantStaffParamsDto {
  @IsUUID()
  exceptionId: string;
}
