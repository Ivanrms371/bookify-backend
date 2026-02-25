import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  BusinessUpdateInput,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class OnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
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

  initialize(ownerId: string) {
    return this.db().business.create({
      data: {
        ownerId,
        onboardingStep: 1,
      },
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
        onboardingCompleted: true,
        isActive: true,
      },
    });
  }
}
