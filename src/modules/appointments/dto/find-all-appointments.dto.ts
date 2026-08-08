import { IsOptional, IsString, IsInt, IsIn, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllAppointmentsParamsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}
