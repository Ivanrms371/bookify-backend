import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from 'src/generated/prisma/enums';

export class CreatePaymentDto {
  @IsString()
  businessId: string;
  @IsString()
  subscriptionId: string;

  @IsNumber()
  transactionAmount: number;
  @IsNumber()
  netReceivedAmount: number;
  @IsString()
  transactionCurrency: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  @IsOptional()
  issuedAt?: Date;

  @IsString()
  @IsOptional()
  paidAt?: Date;

  @IsString()
  @IsOptional()
  dueAt?: Date;

  @IsString()
  @IsOptional()
  invoiceUrl?: string;

  @IsString()
  externalId: string;
}
