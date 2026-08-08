import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsMutuallyExclusiveDiscount', async: false })
export class IsMutuallyExclusiveDiscountConstraint implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const dto = args.object as Record<string, any>;
    const hasPercentage = dto.discountPercentage !== undefined && dto.discountPercentage !== null;
    const hasFixed = dto.discountFixed !== undefined && dto.discountFixed !== null;
    return !(hasPercentage && hasFixed);
  }

  defaultMessage() {
    return 'No puedes aplicar "discountPercentage" y "discountFixed" al mismo tiempo. Elige uno.';
  }
}

export const toBool = (v: unknown): boolean => v === 'true' || v === true;
