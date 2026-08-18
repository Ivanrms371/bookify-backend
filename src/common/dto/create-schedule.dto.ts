import { IsArray, IsInt, IsNotEmpty, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from 'src/common/constants/day-of-week.constants';

export class CreateScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];
}

export class WorkingHoursDto {
  @IsString()
  dayOfWeek: DayOfWeek;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntervalDto)
  intervals: IntervalDto[];
}
[];

export class IntervalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  opensAt: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  closesAt: string;
}
