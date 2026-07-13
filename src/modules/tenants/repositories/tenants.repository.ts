import { Injectable } from '@nestjs/common';
import { MembershipRole, MembershipStatus, OnboardingStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { CreateTenantInput } from '../types/create-tenant.input';
import { UpdateTenantAddressInput } from '../types/update-tenant-address-input.type';
import { TenantOnboardingRaw } from '../features/onboarding/types/onboarding-raw.types';

@Injectable()
export class TenantsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.tenant.findFirst({
      where: { ownerId: userId },
    });
  }

  markOnboardingAsCompleted(id: string, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data: { onboardingStatus: OnboardingStatus.COMPLETED },
    });
  }

  updateAddress(id: string, data: UpdateTenantAddressInput, tx?: TransactionClient) {
    return this.db(tx).tenant.update({
      where: { id },
      data: {
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        province: data.province,
        city: data.city,
      },
    });
  }

  findById(id: string, tx?: TransactionClient) {
    return this.db(tx).tenant.findUnique({
      where: { id },
    });
  }
  create(userId: string, input: CreateTenantInput, tx?: Prisma.TransactionClient) {
    return this.db(tx).tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        type: input.tenantType,
        ownerId: userId,
        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
      },
    });
  }

  getOnboardingStatus(id: string): Promise<TenantOnboardingRaw> {
    return this.db().tenant.findUniqueOrThrow({
      where: { id },
      select: {
        onboardingStatus: true,
        id: true,
        workspaceType: true,
        name: true,
        slug: true,
        type: true,
        logoUrl: true,
        coverUrl: true,
        colorTheme: true,
        tenantWorkingHours: {
          select: {
            dayOfWeek: true,
            opensAt: true,
            closesAt: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
          },
        },
      },
    });
  }
}
