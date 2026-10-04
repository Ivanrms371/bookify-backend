import { Transform } from 'class-transformer';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { TenantType } from 'src/generated/prisma/enums';

export class BusinessStepDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @IsEnum(TenantType)
  type: TenantType;
}
