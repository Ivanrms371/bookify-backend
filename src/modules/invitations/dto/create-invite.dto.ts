import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  ValidateNested,
  IsDecimal,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MembershipRole, CommissionType } from 'src/generated/prisma/enums';
import { CreateScheduleDto } from 'src/common/dto/create-schedule.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { coerceToDecimal } from 'src/common/utils/to-decimal.util';

export class CreateInviteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  phoneCountryCode: string;

  @IsString()
  @IsOptional()
  bio?: string;

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

  @Transform(({ value }) => (value !== undefined && value !== null ? coerceToDecimal(value) : value))
  @IsOptional()
  commissionAmount?: Decimal;
}
