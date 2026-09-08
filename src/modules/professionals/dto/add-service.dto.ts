import { IsUUID } from 'class-validator';

export class AddServiceDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  professionalId: string;

  @IsUUID()
  serviceId: string;
}
