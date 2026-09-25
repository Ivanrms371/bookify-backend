import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GetAvailabilityOverviewParams } from 'src/modules/availability/types/availability.types';

export class GetAvailabilityOverviewDto implements GetAvailabilityOverviewParams {
  @IsUUID('7', { message: 'tenantId debe ser un UUID válido' })
  @IsNotEmpty()
  tenantId: string;

  @IsUUID('7', { message: 'El serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El serviceId es obligatorio.' })
  serviceId: string;

  @IsUUID('7', { message: 'El professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El professionalId es obligatorio.' })
  professionalId: string;

  @IsDateString({}, { message: 'startDate debe tener formato YYYY-MM-DD.' })
  @IsNotEmpty({ message: 'startDate es obligatorio.' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate debe tener formato YYYY-MM-DD.' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  saturationThreshold?: number = 3;
}
