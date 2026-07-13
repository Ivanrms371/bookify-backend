import { IsUUID } from 'class-validator';
import { TenantEmployeeParamsDto } from './tenant-employee.params.dto';

export class TenantEmployeeServiceParamsDto extends TenantEmployeeParamsDto {
  @IsUUID()
  serviceId: string;
}
