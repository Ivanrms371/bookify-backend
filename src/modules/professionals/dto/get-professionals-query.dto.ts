import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max, IsString, IsIn, IsBoolean, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class GetProfessionalsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : (value as unknown)))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : (value as unknown)))
  @IsBoolean()
  count?: boolean;

  @IsOptional()
  @IsUUID('all', { message: 'El serviceId debe ser un UUID válido' })
  serviceId?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.asc;

  @IsOptional()
  @IsIn(['name', 'email', 'isActive', 'createdAt'])
  orderBy?: 'name' | 'email' | 'isActive' | 'createdAt' = 'createdAt';

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
}
