import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string; // HH:MM

  @IsString()
  endTime: string; // HH:MM

  @IsString()
  @IsOptional()
  name?: string;
}

export class UpdateWorkingHoursBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours: WorkingHourDto[];
}
