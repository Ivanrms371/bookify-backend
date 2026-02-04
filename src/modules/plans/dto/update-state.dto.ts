import { IsBoolean } from 'class-validator';

export class UpdatePlanStatusDto {
  @IsBoolean()
  active: boolean;
}
