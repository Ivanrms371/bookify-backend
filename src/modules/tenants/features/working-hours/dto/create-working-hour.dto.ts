import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateWorkingHoursBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkingHourDto)
  workingHours: CreateWorkingHourDto[];
}
