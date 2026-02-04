import { IsString, IsUUID } from 'class-validator';

export class SuscriptionDto {
  @IsString()
  @IsUUID()
  planId: string;
}
