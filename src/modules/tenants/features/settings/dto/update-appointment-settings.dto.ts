import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateAppointmentSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  slotIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAdvancedDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAdvancedMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationWindowMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPendingApptsPerClient?: number;

  @IsOptional()
  @IsBoolean()
  requireConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  holidayClosureAutoApply?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPassiveTimeBooking?: boolean;
}
