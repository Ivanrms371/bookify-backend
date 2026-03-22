import { IsEnum, IsString } from 'class-validator';
import { PlanType } from 'src/generated/prisma/enums';

export class SelectPlanDto {
  @IsString()
  @IsEnum(PlanType)
  planType: PlanType;
}
