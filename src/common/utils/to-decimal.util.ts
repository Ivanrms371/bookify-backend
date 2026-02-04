import { Decimal } from '@prisma/client/runtime/client';

export function toDecimal(value?: number): Decimal | undefined {
  return value !== undefined ? new Decimal(value) : undefined;
}
