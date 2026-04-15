import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  TenantCreateInput,
  TenantOnboardingUpdateInput,
  TenantUpdateInput,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class OnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findById(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({
      where: { id: tenantId },
    });
  }

  findByIdAndOwnerId(id: string, ownerId: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({
      where: { id, ownerId },
    });
  }

  findBySlug(slug: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({
      where: { slug },
    });
  }

  findByTenantId(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).tenantOnboarding.findUnique({
      where: { tenantId },
    });
  }

  getOnboardingStatus(userId: string) {
    return this.db().tenant.findFirst({
      where: {
        ownerId: userId,
        onboardingCompleted: false,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  setup(data: TenantCreateInput, tx?: TransactionClient) {
    return this.db(tx).tenant.create({
      data: {
        ...data,
        onboarding: {
          create: {},
        },
        settings: {
          create: {},
        },
        lifetimeStats: {
          create: {},
        },
      },
    });
  }

  update(id: string, data: TenantUpdateInput, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data,
    });
  }

  updateOnboarding(id: string, data: TenantOnboardingUpdateInput, tx?: TransactionClient) {
    return this.db(tx).tenantOnboarding.update({
      where: { tenantId: id },
      data,
    });
  }

  markOnboardingAsCompleted(id: string, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data: {
        isActive: true,
        isPublic: true,
        onboardingCompleted: true,
      },
    });
  }

  updateOnboardingCompleted(tenantId: string, completed: boolean, tx?: TransactionClient) {
    return this.db(tx).tenantOnboarding.update({
      where: { tenantId },
      data: {
        onboardingCompleted: completed,
      },
    });
  }

  updateTenantAssets(
    tenantId: string,
    assets: {
      logoUrl?: string | null;
      logoPublicId?: string | null;
      coverUrl?: string | null;
      coverPublicId?: string | null;
    },
    tx?: TransactionClient,
  ) {
    return this.db(tx).tenant.update({
      where: { id: tenantId },
      data: assets,
    });
  }
}
