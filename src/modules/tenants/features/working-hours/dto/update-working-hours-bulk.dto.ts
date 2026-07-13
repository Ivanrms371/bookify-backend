import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from 'src/common/constants/day-of-week.constants';

class UpdateWorkingHourDto {
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
  @Type(() => UpdateWorkingHourDto)
  intervals: UpdateWorkingHourDto[];
}

export class UpdateWorkingHoursBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleWorkingHourDto)
  workingHours: ScheduleWorkingHourDto[];
}
