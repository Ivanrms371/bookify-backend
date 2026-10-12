import { IsUUID, IsString, Matches } from 'class-validator';
import { CreateCustomerDto } from 'src/modules/customers/dto/create-customer.dto';
export class CustomerVerificationDto extends CreateCustomerDto {
  @IsUUID() tenantId: string;
}
export class VerifyCustomerVerificationDto {
  @IsUUID() verificationId: string;
  @IsString() @Matches(/^\d{6}$/) code: string;
}
