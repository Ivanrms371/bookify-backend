import { IsString, IsUUID } from 'class-validator';

export class TenantEmployeeParamsDto {
  @IsUUID()
  tenantId: string;
  @IsUUID()
  employeeId: string;
}
