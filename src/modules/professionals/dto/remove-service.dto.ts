import { IsUUID } from 'class-validator';

export class RemoveServiceDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  professionalId: string;

  @IsUUID()
  serviceId: string;
}
