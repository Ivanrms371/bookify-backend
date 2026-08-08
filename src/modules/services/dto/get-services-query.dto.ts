import { IsOptional, IsString, IsInt, Min, IsIn, Max, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class GetServicesQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El professionalId debe ser un UUID válido (v4 o v7)' })
  professionalId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'El campo isActive debe ser un valor booleano (true o false)' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  take?: number = 24;

  @IsOptional()
  @IsBoolean()
  count: boolean = false;

  @IsOptional()
  @IsIn(['name', 'price', 'durationMinutes', 'displayOrder', 'createdAt'])
  orderBy: 'name' | 'price' | 'durationMinutes' | 'displayOrder' | 'createdAt' = 'displayOrder';

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = 'asc';
}
