import { IsOptional, IsString, IsInt, IsIn, Min, IsEnum, IsUUID, ValidateBy, isISO8601 } from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value)))
  @ValidateBy({
    name: 'appointmentDate',
    validator: {
      validate: (value: unknown) =>
        value instanceof Date
          ? Number.isFinite(value.getTime())
          : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isISO8601(value, { strict: true }),
      defaultMessage: () => 'date must be a valid calendar date or timestamp',
    },
  })
  date?: string | Date;
}
