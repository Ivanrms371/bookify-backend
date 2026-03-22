import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty, ValidateNested, Min, IsDecimal, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/client';
import { BillingCycle, PlanType } from 'src/generated/prisma/enums';

class CreatePlanLimitsDto {
  @IsNumber()
  @Min(0)
  softMonthlyLimit: number;

  @IsNumber()
  @Min(0)
  hardMonthlyLimit: number;

  @IsNumber()
  @Min(1)
  dailyMessagesLimit: number;

  @IsNumber()
  dailyOtpLimit: number;

  @IsDecimal()
  maxMonthlyCost: Decimal;
}

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(PlanType)
  type: PlanType;

  @IsString()
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsNumber()
  @IsOptional()
  trialDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  duration: number;

  @IsOptional()
  features?: any;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreatePlanLimitsDto)
  limits: CreatePlanLimitsDto;
}
