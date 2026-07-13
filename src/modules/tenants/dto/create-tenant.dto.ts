import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TenantType } from 'src/generated/prisma/enums';

export class CreateTenantDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  slug: string;

  @IsEnum(TenantType)
  tenantType: TenantType;
}
