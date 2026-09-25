import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { DAY_OF_WEEK_VALUES, DayOfWeek } from 'src/common/constants/day-of-week.constants';
import { IntervalDto } from 'src/common/dto/create-schedule.dto';

export class CreateScheduleExceptionDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  isClosed: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  professionalIds: string[];

  @ValidateIf(({ isClosed }) => !isClosed)
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IntervalDto)
  intervals?: IntervalDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
