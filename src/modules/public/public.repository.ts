import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class PublicRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTenantBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug, isActive: true, isPublic: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        logoUrl: true,
        coverUrl: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        province: true,
        country: true,
        settings: {
          select: {
            maxAdvancedDays: true,
            requireConfirmation: true,
            timeZone: true,
            currency: true,
          },
        },
        professionals: {
          where: { deletedAt: null },
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        services: {
          where: { deletedAt: null, isActive: true },
          select: {
            name: true,
            imageUrl: true,
            description: true,
            durationMinutes: true,
            price: true,
          },
        },
      },
    });
  }

  findAllServices(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
    });
  }

  findAllServicesByProfessional(professionalId: string) {
    return this.prisma.service.findMany({
      where: { isActive: true, deletedAt: null, assignments: { some: { professionalId, isActive: true } } },
    });
  }

  findAllProfessionals(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
    });
  }

  findAllProfessionalsByService(serviceId: string) {
    return this.prisma.professional.findMany({
      where: { deletedAt: null, isActive: true, assignments: { some: { serviceId } } },
    });
  }
}
