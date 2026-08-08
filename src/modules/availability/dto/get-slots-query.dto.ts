import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetSlotsQueryDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
