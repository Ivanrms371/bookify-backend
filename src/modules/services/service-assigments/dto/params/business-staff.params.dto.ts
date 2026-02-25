import { IsString, IsUUID } from 'class-validator';

export class BusinessStaffParamsDto {
  @IsUUID()
  businessId: string;
  @IsUUID()
  staffId: string;
}
