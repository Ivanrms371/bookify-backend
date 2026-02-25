import { IsUUID } from 'class-validator';
import { BusinessStaffParamsDto } from './business-staff.params.dto';

export class BusinessStaffServiceParamsDto extends BusinessStaffParamsDto {
  @IsUUID()
  serviceId: string;
}
