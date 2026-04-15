import { IsString, IsUUID } from 'class-validator';

export class TenantStaffParamsDto {
  @IsUUID()
  tenantId: string;
  @IsUUID()
  staffId: string;
}
