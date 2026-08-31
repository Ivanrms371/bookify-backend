import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class PublicTenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string) {
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
}
