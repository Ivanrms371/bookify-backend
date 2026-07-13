import { Transform } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { TenantType } from 'src/generated/prisma/enums';

export class BusinessStepDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEnum(TenantType)
  type: TenantType;
}
