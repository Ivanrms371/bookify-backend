import { IsDate, IsInt, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class CreateWorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = domingo, 6 = sábado

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startsAt: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endsAt: string;
}
