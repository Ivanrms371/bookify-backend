import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { Tenant } from 'src/generated/prisma/client';
import { MembershipRole, OnboardingStatus } from 'src/generated/prisma/enums';
import { ServiceCreateManyInput, TenantUpdateInput, TenantWorkingHoursCreateManyInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantOnboardingRaw } from './types/onboarding-raw.types';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TenantOnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  getStatus(userId: string): Promise<TenantOnboardingRaw> {
    return this.db().tenant.findFirstOrThrow({
      where: { memberships: { some: { userId, role: MembershipRole.OWNER } } },
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

  async findByOwnerId(userId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: {
        memberships: { some: { userId, role: MembershipRole.OWNER } },
        deletedAt: null,
      },
    });
  }

  async createInitialTenant(userId: string): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
          },
        },
        onboardingStatus: OnboardingStatus.WORKSPACE_TYPE,
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

  async claimConfirmation(tenantId: string, tx: TransactionClient): Promise<boolean> {
    const result = await tx.tenant.updateMany({
      where: { id: tenantId, onboardingStatus: OnboardingStatus.CONFIRM },
      data: { onboardingStatus: OnboardingStatus.COMPLETED },
    });
    return result.count === 1;
  }

  async completeOnboarding(tenantId: string, tx?: TransactionClient): Promise<Tenant> {
    return this.db(tx).tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        isPublic: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        settings: { create: {} },
        lifetimeStats: { create: {} },
      },
    });
  }

  async replaceSchedules(tenantId: string, data: TenantWorkingHoursCreateManyInput[], tx?: TransactionClient): Promise<void> {
    await this.db(tx).tenantWorkingHours.deleteMany({ where: { tenantId } });
    await this.db(tx).tenantWorkingHours.createMany({ data });
  }

  async replaceServices(tenantId: string, data: ServiceCreateManyInput[], tx?: TransactionClient): Promise<void> {
    await this.db(tx).service.deleteMany({ where: { tenantId } });
    await this.db(tx).service.createMany({ data });
  }
}
