import { Decimal } from '@prisma/client/runtime/client';

export type ServiceAssignmentWithService = {
  employeeId: string;
  serviceId: string;
  customPrice: Decimal | null;
  customDiscountPercentage: Decimal | null;
  customDiscountFixed: Decimal | null;
  customDurationMinutes: number | null;
  isActive: boolean;
  service: {
    id: string;
    tenantId: string;
    name: string;
    image: string | null;
    description: string | null;
    price: Decimal;
    discountPercentage: Decimal | null;
    discountFixed: Decimal | null;

    durationMinutes: number | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
};
