import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipRole, CommissionType } from 'src/generated/prisma/enums';
import { CreateScheduleDto } from 'src/common/dto/create-schedule.dto';

export class UpdateProfessionalDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  phoneCountryCode?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  @IsEnum(MembershipRole)
  @IsOptional()
  role?: MembershipRole;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];

  @IsEnum(CommissionType)
  @IsOptional()
  commissionType?: CommissionType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  commissionAmount?: number;

  @ValidateNested()
  @Type(() => CreateScheduleDto)
  @IsOptional()
  schedule?: CreateScheduleDto;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  slotIntervalMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxAdvancedDays?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minAdvancedMinutes?: number;
}
