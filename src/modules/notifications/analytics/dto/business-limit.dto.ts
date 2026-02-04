import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { PlanType } from 'src/generated/prisma/enums';

export class CreateBusinessLimitDto {
  @IsString()
  businessId: string;

  @IsEnum(PlanType)
  plan: PlanType;

  @IsNumber()
  whatsappLimit: number;

  @IsNumber()
  professionalLimit: number;

  @IsNumber()
  periodMonth: number;

  @IsNumber()
  periodYear: number;

  @IsDate()
  lastResetAt: Date;
}

export class UpdateBusinessLimitDto {
  @IsEnum(PlanType)
  plan?: PlanType;

  @IsNumber()
  whatsappLimit?: number;

  @IsNumber()
  professionalLimit?: number;
}
