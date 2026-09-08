import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAvailabilityOverviewQueryDto {
  @IsUUID('7', { message: 'professionalId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'professionalId es obligatorio.' })
  professionalId: string;

  @IsUUID('7', { message: 'serviceId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'serviceId es obligatorio.' })
  serviceId: string;

  @IsDateString({}, { message: 'startDate debe tener formato YYYY-MM-DD.' })
  @IsNotEmpty({ message: 'startDate es obligatorio.' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate debe tener formato YYYY-MM-DD.' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'saturationThreshold debe ser un número entero.' })
  @Min(1)
  @Max(10)
  saturationThreshold?: number = 3;
}
