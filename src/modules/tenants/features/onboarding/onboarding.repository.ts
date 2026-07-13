import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { Tenant } from 'src/generated/prisma/client';
import { MembershipRole, MembershipStatus, OnboardingStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { ServiceCreateManyArgs, ServiceCreateManyInput, TenantUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantOnboardingRaw } from './types/onboarding-raw.types';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TenantOnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  getOnboardingStatus(ownerId: string): Promise<TenantOnboardingRaw> {
    return this.db().tenant.findUniqueOrThrow({
      where: { ownerId },
      select: {
        id: true,
        onboardingStatus: true,
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

  async findTenantByOwnerId(ownerId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: {
        ownerId,
        deletedAt: null,
      },
    });
  }

  async createInitialTenant(ownerId: string): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        ownerId,
        onboardingStatus: OnboardingStatus.WORKSPACE_TYPE,

        memberships: {
          create: {
            userId: ownerId,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async update(tenantId: string, data: TenantUpdateInput, tx?: TransactionClient): Promise<Tenant> {
    return this.db(tx).tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async updateStatus(tenantId: string, status: OnboardingStatus, tx?: TransactionClient): Promise<Tenant> {
    return this.db(tx).tenant.update({
      where: { id: tenantId },
      data: { onboardingStatus: status },
    });
  }

  async finalizeAndActivateTenant(tenantId: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        isPublic: true,
        onboardingStatus: OnboardingStatus.COMPLETED,

        settings: {
          create: {},
        },
        lifetimeStats: {
          create: {},
        },
      },
    });
  }

  async replaceServices(tenantId: string, data: ServiceCreateManyInput[], tx?: TransactionClient): Promise<void> {
    await this.db(tx).service.deleteMany({ where: { tenantId } });
    await this.db(tx).service.createMany({ data });
  }
}
