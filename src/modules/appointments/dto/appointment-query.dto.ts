import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { SortOrder } from 'src/generated/prisma/internal/prismaNamespace';

export class GetAppointmentsQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  take?: number = 24;

  @IsOptional()
  @IsIn(['name', 'startTime', 'createdAt'])
  orderBy?: 'name' | 'startTime' | 'createdAt' = 'startTime';

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = 'desc';
}
