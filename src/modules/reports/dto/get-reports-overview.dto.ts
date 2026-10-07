import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min, ValidateBy, isISO8601 } from 'class-validator';
import type { ReportPeriod, ReportQuery } from '../types/reports.types';

function CalendarDate() {
  return ValidateBy({
    name: 'calendarDate',
    validator: {
      validate: (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isISO8601(value, { strict: true }),
      defaultMessage: () => 'Debe ser una fecha válida en formato YYYY-MM-DD.',
    },
  });
}

export class GetReportsOverviewDto implements ReportQuery {
  @IsOptional()
  @IsIn(['this-month', 'last-month', 'custom'])
  period: ReportPeriod = 'this-month';

  @IsOptional()
  @CalendarDate()
  startDate?: string;

  @IsOptional()
  @CalendarDate()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topServicesLimit: number = 4;
}
