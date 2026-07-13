import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHourDto {
  @IsNumber()
  dayOfWeek: number;

  @IsNumber()
  opensAt: number;

  @IsNumber()
  closesAt: number;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsOptional()
  name?: string;
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours: WorkingHourDto[];

  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];
}
