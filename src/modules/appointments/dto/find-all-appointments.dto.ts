import { IsOptional, IsString, IsInt, IsIn, Min, IsDate, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export class FindAllAppointmentsParamsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn(['startsAt', 'createdAt'])
  orderBy?: 'startsAt' | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  state?: AppointmentStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}
