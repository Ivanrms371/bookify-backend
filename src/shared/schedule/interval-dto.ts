import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { DayOfWeek } from 'src/common/constants/day-of-week.constants';

export class TimeIntervalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  opensAt: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  closesAt: string;
}

export class WorkingHoursDto {
  @IsString()
  dayOfWeek: DayOfWeek;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeIntervalDto)
  intervals: TimeIntervalDto[];
}
[];
