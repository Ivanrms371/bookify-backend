import { IsDate, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class UpdateWorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  dayOfWeek?: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  @IsOptional()
  startsAt?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  @IsOptional()
  endsAt?: string;
}
