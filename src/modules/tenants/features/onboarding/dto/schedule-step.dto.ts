import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { DayOfWeek } from 'src/common/constants/day-of-week.constants';

class ScheduleIntervalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  opensAt: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  closesAt: string;
}

class ScheduleWorkingHourDto {
  @IsString()
  dayOfWeek: DayOfWeek;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleIntervalDto)
  intervals: ScheduleIntervalDto[];
}

export class ScheduleStepDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleWorkingHourDto)
  workingHours: ScheduleWorkingHourDto[];
}
