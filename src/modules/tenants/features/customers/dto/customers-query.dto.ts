// customers-query.dto.ts
import { IsOptional, IsString, IsInt, Min, IsIn, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class  CustomersQueryDto {
  @IsOptional()
  @IsString()
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
  @IsIn(['name', 'createdAt'])
  orderBy?: 'name' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = 'desc';
}
