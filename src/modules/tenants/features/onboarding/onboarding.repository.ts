import type { LocationDefaults } from 'src/shared/location/types/location.types';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { Prisma, Tenant } from 'src/generated/prisma/client';
import { MembershipRole, OnboardingStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { ServiceCreateManyInput, TenantUpdateInput, TenantWorkingHoursCreateManyInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantOnboardingRaw } from './types/onboarding-raw.types';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class TenantOnboardingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  getStatus(userId: string, tenantId?: string): Promise<TenantOnboardingRaw> {
    return this.db().tenant.findFirstOrThrow({
      where: {
        ...(tenantId ? { id: tenantId } : {}),
        deletedAt: null,
        memberships: { some: { userId, role: MembershipRole.OWNER, isActive: true } },
      },
      select: {
        id: true,
        onboardingStatus: true,
        workspaceType: true,
        name: true,
        slug: true,
        type: true,
        settings: { select: { currency: true, timeZone: true } },
        country: true,
        province: true,
        city: true,
        addressLine1: true,
        addressLine2: true,
        phoneNumber: true,
        logoUrl: true,
        coverUrl: true,
        colorTheme: true,
        logoPublicId: true,
        coverPublicId: true,
        onboardingProfessionalDraft: true,
        tenantWorkingHours: {
          select: {
            dayOfWeek: true,
            opensAt: true,
            closesAt: true,
          },
        },
        services: {
          where: { deletedAt: null, isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
            imageUrl: true,
            imagePublicId: true,
          },
        },
      },
    });
  }

  async findByOwnerId(userId: string, tenantId?: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: {
        ...(tenantId ? { id: tenantId } : {}),
        memberships: { some: { userId, role: MembershipRole.OWNER, isActive: true } },
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
        onboardingStatus: OnboardingStatus.BUSINESS_DETAILS,
        workspaceType: WorkspaceType.INDIVIDUAL,
      },
    });
  }

  async lockOwner(userId: string, tx: TransactionClient) {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`);
  }

  async lockTenant(tenantId: string, tx: TransactionClient) {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM tenants WHERE id = ${tenantId}::uuid FOR UPDATE`);
    return tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
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

  async completeOnboarding(tenantId: string, tx: TransactionClient, defaults: LocationDefaults): Promise<Tenant> {
    return this.db(tx).tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        isPublic: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        settings: { upsert: { create: defaults, update: defaults } },
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
