import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class EmployeeQueryParamsDto {
  @IsString()
  @IsOptional()
  query?: string;

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
  @IsIn(['displayOrder', 'createdAt'])
  orderBy?: 'displayOrder' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = 'asc';
}
