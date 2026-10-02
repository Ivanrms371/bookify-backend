// customers-query.dto.ts
import { IsOptional, IsString, IsInt, Min, IsIn, Max, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class FindAllCustomersParams {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsIn(['all', 'unblocked', 'blocked'])
  status?: 'all' | 'unblocked' | 'blocked';

  @IsOptional()
  @IsIn(['all', 'upcoming', 'never-booked'])
  bookingActivity?: 'all' | 'upcoming' | 'never-booked';

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
  @IsIn(['name', 'createdAt', 'lastVisitAt', 'totalSpent'])
  orderBy?: 'name' | 'createdAt' | 'lastVisitAt' | 'totalSpent' = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = 'desc';
}
