import { Decimal } from '@prisma/client/runtime/client';
import { ServiceAssignment } from 'src/generated/prisma/client';
import { ServiceAssignmentWithService } from './service-assignment.types';

export function mapServiceAssignmentToPublic(assignment: ServiceAssignmentWithService) {
  const service = assignment.service;

  const basePrice: Decimal = assignment.customPrice ?? service.price;

  let finalPrice: Decimal = basePrice;

  const discountPercentage = assignment.customDiscountPercentage
    ? new Decimal(assignment.customDiscountPercentage)
    : (service.discountPercentage ?? new Decimal(0));

  const discountFixed = assignment.customDiscountFixed
    ? new Decimal(assignment.customDiscountFixed)
    : (service.discountFixed ?? new Decimal(0));

  if (discountPercentage.gt(0)) {
    finalPrice = finalPrice.mul(new Decimal(1).sub(discountPercentage.div(100)));
  }

  if (discountFixed.gt(0)) {
    finalPrice = finalPrice.sub(discountFixed);
  }

  const durationMinutes = assignment.customDurationMinutes ?? service.durationMinutes;

  return {
    serviceId: service.id,
    name: service.name,
    description: service.description,
    image: service.image,
    price: basePrice.toNumber(),
    finalPrice: finalPrice.toNumber(),
    durationMinutes,
    isActive: assignment.isActive && service.isActive,
  };
}

export function mapServiceAssignmentsToPublic(assignments: ServiceAssignmentWithService[]) {
  return assignments.map(mapServiceAssignmentToPublic);
}
