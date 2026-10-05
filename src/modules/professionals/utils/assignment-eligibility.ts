import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { InvalidProfessionalServicesException } from '../exceptions/invalid-professional-services.exception';

export async function verifyAssignableServices(tenantId: string, serviceIds: string[], tx: TransactionClient, retained: string[] = []) {
  if (new Set(serviceIds).size !== serviceIds.length) throw new InvalidProfessionalServicesException();
  if (!serviceIds.length) return;
  const services = await tx.service.findMany({
    where: { id: { in: serviceIds }, tenantId, deletedAt: null, OR: [{ isActive: true }, { id: { in: retained } }] },
    select: { id: true },
  });
  if (services.length !== serviceIds.length) throw new InvalidProfessionalServicesException();
}
