import { Decimal } from '@prisma/client/runtime/client';

function isDecimalLike(value: unknown): value is { toNumber: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  );
}

export function coerceToDecimal(value: unknown): Decimal | undefined {
  if (value === '' || value === undefined || value === null) return undefined;
  if (value instanceof Decimal) return value;
  if (isDecimalLike(value)) return new Decimal(value.toNumber());
  return new Decimal(value as string | number);
}

export function coerceToNumber(value: unknown): number | undefined {
  if (value === '' || value === undefined || value === null) return undefined;
  if (value instanceof Decimal) return value.toNumber();
  if (isDecimalLike(value)) return value.toNumber();
  return Number(value);
}

export function coerceToInt(value: unknown): number | undefined {
  const numeric = coerceToNumber(value);
  return numeric === undefined ? undefined : Math.trunc(numeric);
}

export function toDecimal(value?: number): Decimal | undefined {
  return value !== undefined ? new Decimal(value) : undefined;
}
