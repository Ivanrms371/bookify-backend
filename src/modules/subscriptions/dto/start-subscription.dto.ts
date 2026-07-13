import { IsString, IsUUID } from 'class-validator';

export class StartSubscriptionDto {
  @IsUUID()
  @IsString()
  tenantId: string;

  @IsString()
  planId: string;
}
