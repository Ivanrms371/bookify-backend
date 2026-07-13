import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateScheduleExceptionDto {
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];

  @IsBoolean()
  isClosed: boolean;

  blocks: CreateScheduleExceptionBlockDto[];
}

class CreateScheduleExceptionBlockDto {
  @IsString()
  startAt: string;

  @IsString()
  endAt: string;
}
