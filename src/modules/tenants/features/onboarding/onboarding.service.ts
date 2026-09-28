import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from 'src/generated/prisma/client';
import { OnboardingStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantOnboardingRepository } from './onboarding.repository';
import { OnboardingMapper } from './mappers/onboarding.mapper';
import { getNextOnboardingStep } from './config/get-next-onboarding-step';
import { WorkspaceStepDto } from './dto/workspace-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { generateSlugTenant } from '../../utils/generate-slug.util';
import { DAY_OF_WEEK_TO_INT } from 'src/common/constants/day-of-week.constants';
import { TenantWorkingHoursCreateManyInput } from 'src/generated/prisma/models';
import { timeToMinutes } from 'src/shared/schedule';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';

@Injectable()
export class TenantOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantOnboardingRepository: TenantOnboardingRepository,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getStatus(onwerId: string) {
    const raw = await this.tenantOnboardingRepository.getStatus(onwerId);
    return OnboardingMapper.toResponse(raw);
  }

  async initalize(ownerId: string) {
    const existing = await this.tenantOnboardingRepository.findByOwnerId(ownerId);
    if (!existing) {
      await this.tenantOnboardingRepository.createInitialTenant(ownerId);
    }
    return this.getStatus(ownerId);
  }

  async updateWorkspace(userId: string, dto: WorkspaceStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const nextStep = getNextOnboardingStep(dto.workspaceType, OnboardingStatus.WORKSPACE_TYPE);

    await this.tenantOnboardingRepository.update(tenant.id, {
      onboardingStatus: nextStep,
      workspaceType: dto.workspaceType,
    });

    return this.getStatus(userId);
  }

  async updateBusiness(userId: string, dto: BusinessStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const slug = await this.generateAvailableSlug(dto.name);

    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.BUSINESS_DETAILS);
    await this.tenantOnboardingRepository.update(tenant.id, {
      ...(tenant.onboardingStatus === OnboardingStatus.BUSINESS_DETAILS && { onboardingStatus: nextStep }),
      name: dto.name,
      slug,
      type: dto.type,
    });

    return this.getStatus(userId);
  }

  async updateSchedule(userId: string, dto: ScheduleStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);

    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.SCHEDULE);

    const schedule: TenantWorkingHoursCreateManyInput[] = dto.workingHours.flatMap((sch) => {
      const dayOfWeek = DAY_OF_WEEK_TO_INT[sch.dayOfWeek];

      if (!sch.isActive) return [];

      return sch.intervals.map((interval) => {
        const opensAt = timeToMinutes(interval.opensAt);
        const closesAt = timeToMinutes(interval.closesAt);

        return {
          tenantId: tenant.id,
          dayOfWeek,
          opensAt,
          closesAt,
        };
      });
    });

    await this.prisma.$transaction(async (tx) => {
      await this.tenantOnboardingRepository.replaceSchedules(tenant.id, schedule, tx);
      if (tenant.onboardingStatus === OnboardingStatus.SCHEDULE) {
        await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep, tx);
      }
    });

    return this.getStatus(userId);
  }

  async updateServices(userId: string, dto: ServicesStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.SERVICES);

    const services = dto.services.map((service) => ({
      tenantId: tenant.id,
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
    }));

    await this.prisma.$transaction(async (tx) => {
      await this.tenantOnboardingRepository.replaceServices(tenant.id, services, tx);
      if (tenant.onboardingStatus === OnboardingStatus.SERVICES) {
        await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep, tx);
      }
    });

    return this.getStatus(userId);
  }

  async updateTeam(userId: string) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.TEAM_INVITE);

    if (tenant.onboardingStatus === OnboardingStatus.TEAM_INVITE) {
      await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep);
    }

    return this.getStatus(userId);
  }

  async updateCustomize(userId: string, dto: CustomizeStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.CUSTOMIZE);

    await this.tenantOnboardingRepository.update(tenant.id, {
      logoUrl: dto.logoUrl,
      coverUrl: dto.coverUrl,
      colorTheme: dto.colorTheme,
      ...(tenant.onboardingStatus === OnboardingStatus.CUSTOMIZE && { onboardingStatus: nextStep }),
    });

    return this.getStatus(userId);
  }

  async confirm(userId: string) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);

    const tenantId = tenant.id;

    await this.prisma.$transaction(async (tx) => {
      await this.tenantOnboardingRepository.update(
        tenantId,
        {
          isActive: true,
          isPublic: true,
          onboardingStatus: OnboardingStatus.COMPLETED,
          settings: { create: {} },
          lifetimeStats: { create: {} },
        },
        tx,
      );
      await this.subscriptionsService.createTrialSubscription(tenantId);
    });

    return this.getStatus(userId);
  }

  private async requireTenantByOwnerId(userId: string): Promise<Tenant> {
    const tenant = await this.tenantOnboardingRepository.findByOwnerId(userId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private getWorkspaceTypeOrThrow(tenant: Tenant): WorkspaceType {
    if (!tenant.workspaceType) {
      throw new BadRequestException('Tenant workspace type is required before updating this onboarding step');
    }
    return tenant.workspaceType;
  }

  private async generateAvailableSlug(name: string): Promise<string> {
    const baseSlug =
      generateSlugTenant(name)
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'business';
    const firstCandidate = baseSlug;
    const firstMatch = await this.tenantOnboardingRepository.findBySlug(firstCandidate);

    if (!firstMatch) {
      return firstCandidate;
    }

    while (true) {
      const suffix = this.randomSuffix(6);
      const candidate = `${baseSlug}-${suffix}`;
      const existing = await this.tenantOnboardingRepository.findBySlug(candidate);
      if (!existing) {
        return candidate;
      }
    }
  }

  private randomSuffix(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}
