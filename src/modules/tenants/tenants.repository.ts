import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class TenantsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        phoneNumber: true,
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
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            description: true,
            price: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id, deletedAt: null } });
  }
}
