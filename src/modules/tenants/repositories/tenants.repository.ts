import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { TenantUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TenantsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.tenant.findFirst({
      where: { ownerId },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  updateByOwnerId(id: string, data: TenantUpdateInput) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  markOnboardingAsCompleted(id: string, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data: { onboardingCompleted: true },
    });
  }

  updateTenantStatus(id: string, isPublic: boolean, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data: { isPublic },
    });
  }

  findById(id: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({
      where: { id },
      include: { onboarding: true },
    });
  }

  findUnique(args: Prisma.TenantFindUniqueArgs) {
    return this.prisma.tenant.findUnique(args);
  }

  findFirst(args: Prisma.TenantFindFirstArgs) {
    return this.prisma.tenant.findFirst(args);
  }

  findAllTenantesByUser(userId: string) {
    return this.prisma.tenant.findMany({
      where: { members: { some: { userId } } },
    });
  }

  update(args: Prisma.TenantUpdateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.tenant.update(args);
  }

  upsert(args: Prisma.TenantUpsertArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.tenant.upsert({
      ...args,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        type: true,
        addressLine1: true,
        addressLine2: true,
        phone: true,
        logoUrl: true,
        coverUrl: true,
        onboardingCompleted: true,
      },
    });
  }
}
