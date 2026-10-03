import type { PaymentStatus } from 'src/generated/prisma/enums';

export interface PaymentDto {
  id: string;
  referenceCode: string;
  date: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  invoiceAvailable: boolean;
}
