import { IsUUID } from 'class-validator';
import { TenantStaffParamsDto } from './tenant-staff.params.dto';

export class TenantStaffServiceParamsDto extends TenantStaffParamsDto {
  @IsUUID()
  serviceId: string;
}
