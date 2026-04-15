import { IsDateString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReportsQueryDto {
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate: string;

  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate: string;

  @IsOptional()
  @Type(() => Number) 
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsUUID('7', { message: 'staffId must be a valid UUIDv7' }) 
  staffId?: string;
}