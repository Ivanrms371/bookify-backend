import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipRole, CommissionType } from 'src/generated/prisma/enums';
import { CreateScheduleDto } from 'src/common/dto/create-schedule.dto';

export class UpdateProfessionalDto {
  @IsString()
  @IsOptional()
  colorTheme?: string | null;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  phoneCountryCode?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string | null;

  @IsString()
  @IsOptional()
  avatarPublicId?: string | null;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  serviceIds?: string[];
}
