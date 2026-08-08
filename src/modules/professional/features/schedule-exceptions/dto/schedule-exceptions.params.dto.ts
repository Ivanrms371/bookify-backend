import { IsOptional, IsUUID } from 'class-validator';

export class TenantProfessionalParamsDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  professionalId: string;
}

export class TenantProfessionalExceptionsParamsDto extends TenantProfessionalParamsDto {
  @IsUUID()
  exceptionId: string;
}
