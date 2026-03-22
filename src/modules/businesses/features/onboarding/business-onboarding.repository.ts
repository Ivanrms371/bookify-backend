import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { BusinessCreateInput, BusinessUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BusinessOnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findByIdAndOwner(businessId: string, ownerId: string, tx?: TransactionClient) {
    return this.db(tx).business.findUnique({
      where: { id: businessId, ownerId },
    });
  }

  findByOwnerId(ownerId: string, tx?: TransactionClient) {
    return this.db(tx).business.findUnique({
      where: { ownerId },
    });
  }

  findBySlug(slug: string, tx?: TransactionClient) {
    return this.db(tx).business.findUnique({
      where: { slug },
    });
  }

  findByBusinessId(businessId: string, tx?: TransactionClient) {
    return this.db(tx).businessOnboarding.findUnique({
      where: { businessId },
    });
  }

  getOnboardingStatus(ownerId: string) {
    return this.db().business.findUnique({
      where: { ownerId },
      select: {
        id: true,
        onboardingCompleted: true,
        subscription: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  create(data: BusinessCreateInput, tx?: TransactionClient) {
    return this.db(tx).business.create({
      data,
    });
  }

  updateByOwnerId(ownerId: string, data: BusinessUpdateInput, tx?: TransactionClient) {
    return this.db(tx).business.update({
      where: { ownerId },
      data,
    });
  }

  markOnboardingAsCompleted(ownerId: string, tx?: TransactionClient) {
    return this.db(tx).business.update({
      where: { ownerId },
      data: {
        isActive: true,
        isPublic: true,
        onboardingCompleted: true,
      },
    });
  }

  updateOnboardingCompleted(businessId: string, completed: boolean, tx?: TransactionClient) {
    return this.db(tx).businessOnboarding.update({
      where: { businessId },
      data: {
        onboardingCompleted: completed,
      },
    });
  }

  updateBusinessAssets(
    businessId: string,
    assets: {
      logoUrl?: string | null;
      logoPublicId?: string | null;
      coverUrl?: string | null;
      coverPublicId?: string | null;
    },
    tx?: TransactionClient,
  ) {
    return this.db(tx).business.update({
      where: { id: businessId },
      data: assets,
    });
  }
}
