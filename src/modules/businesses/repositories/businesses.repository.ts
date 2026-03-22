import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BusinessCreateInput, BusinessUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class BusinessesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findByOwnerId(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.business.findUnique({
      where: { slug },
    });
  }

  updateByOwnerId(ownerId: string, data: BusinessUpdateInput) {
    return this.prisma.business.update({
      where: { ownerId },
      data,
    });
  }

  markOnboardingAsCompleted(ownerId: string, tx?: TransactionClient) {
    return this.db(tx).business.update({
      where: { ownerId },
      data: { onboardingCompleted: true },
    });
  }

  updateBusinessStatus(id: string, isPublic: boolean, tx?: TransactionClient) {
    return this.db(tx).business.update({
      where: { id },
      data: { isPublic },
    });
  }

  findById(id: string, tx?: TransactionClient) {
    return this.db(tx).business.findUnique({
      where: { id },
      include: { onboarding: true },
    });
  }

  findUnique(args: Prisma.BusinessFindUniqueArgs) {
    return this.prisma.business.findUnique(args);
  }

  findFirst(args: Prisma.BusinessFindFirstArgs) {
    return this.prisma.business.findFirst(args);
  }

  findAllBusinessesByUser(userId: string) {
    return this.prisma.business.findMany({
      where: { members: { some: { userId } } },
    });
  }

  update(args: Prisma.BusinessUpdateArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.business.update(args);
  }

  upsert(args: Prisma.BusinessUpsertArgs, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.business.upsert({
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
