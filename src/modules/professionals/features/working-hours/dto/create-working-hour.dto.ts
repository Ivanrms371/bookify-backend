import { IsArray, IsInt, IsNotEmpty, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from 'src/common/constants/day-of-week.constants';

export class CreateWorkingHoursBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkingHourDto)
  workingHours: CreateWorkingHourDto[];
}

class CreateWorkingHourDto {
  @IsString()
  dayOfWeek: DayOfWeek;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntervalDto)
  intervals: IntervalDto[];
}
[];

class IntervalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  opensAt: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  closesAt: string;
}
