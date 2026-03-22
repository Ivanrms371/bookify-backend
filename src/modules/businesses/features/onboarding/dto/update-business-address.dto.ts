import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessAddressDto {
  @IsString()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
