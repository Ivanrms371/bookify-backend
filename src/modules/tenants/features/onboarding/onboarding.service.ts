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
import { TeamStepDto } from './dto/team-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { ConfirmStepDto } from './dto/confirm-step.dto';
import { TenantWorkingHoursService } from '../working-hours/tenant-working-hours.service';
import { generateSlugTenant } from '../../utils/generate-slug.util';

@Injectable()
export class TenantOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantOnboardingRepository: TenantOnboardingRepository,
    private readonly workingHoursService: TenantWorkingHoursService,
  ) {}

  async getStatus(onwerId: string) {
    const raw = await this.tenantOnboardingRepository.getStatus(onwerId);
    return OnboardingMapper.toResponse(raw);
  }

  async initalize(ownerId: string, ownerName: string) {
    const tenant = await this.tenantOnboardingRepository.findByOwnerId(ownerId);
    if (tenant) {
      return tenant;
    }
    return this.tenantOnboardingRepository.createInitialTenant(ownerId, ownerName);
  }

  async updateWorkspace(userId: string, body: WorkspaceStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const nextStep = getNextOnboardingStep(body.workspaceType, OnboardingStatus.WORKSPACE_TYPE);

    if (tenant.onboardingStatus === OnboardingStatus.WORKSPACE_TYPE) {
      await this.tenantOnboardingRepository.update(tenant.id, {
        workspaceType: body.workspaceType,
        onboardingStatus: nextStep,
      });
    } else {
      console.log('updateWorkspace', body.workspaceType);
      await this.tenantOnboardingRepository.update(tenant.id, { workspaceType: body.workspaceType });
    }

    return this.getStatus(userId);
  }

  async updateBusiness(userId: string, body: BusinessStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.BUSINESS_DETAILS);
    const slug = await this.generateAvailableSlug(body.name);

    if (tenant.onboardingStatus === OnboardingStatus.BUSINESS_DETAILS) {
      await this.tenantOnboardingRepository.update(tenant.id, {
        name: body.name,
        slug,
        type: body.type,
        onboardingStatus: nextStep,
      });
    } else {
      await this.tenantOnboardingRepository.update(tenant.id, { name: body.name, slug, type: body.type });
    }

    return this.getStatus(userId);
  }

  async updateSchedule(userId: string, body: ScheduleStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.SCHEDULE);

    await this.prisma.$transaction(async (tx) => {
      await this.workingHoursService.bulkUpdate(tenant.id, body, tx);
      if (tenant.onboardingStatus === OnboardingStatus.SCHEDULE) {
        await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep);
      }
    });

    return this.getStatus(userId);
  }

  async updateServices(userId: string, body: ServicesStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.SERVICES);

    const services = body.services.map((service) => ({
      tenantId: tenant.id,
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
    }));

    await this.prisma.$transaction(async (tx) => {
      await this.tenantOnboardingRepository.replaceServices(tenant.id, services, tx);
      await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep, tx);
    });

    return this.getStatus(userId);
  }

  async updateTeam(userId: string, _body: TeamStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.TEAM_INVITE);

    if (tenant.onboardingStatus === OnboardingStatus.TEAM_INVITE) {
      await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep);
    }

    return this.getStatus(userId);
  }

  async updateCustomize(userId: string, body: CustomizeStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.CUSTOMIZE);

    if (tenant.onboardingStatus === OnboardingStatus.CUSTOMIZE) {
      await this.tenantOnboardingRepository.update(tenant.id, {
        logoUrl: body.logoUrl,
        coverUrl: body.coverUrl,
        colorTheme: body.colorTheme,
        onboardingStatus: nextStep,
      });
    } else {
      await this.tenantOnboardingRepository.update(tenant.id, {
        logoUrl: body.logoUrl,
        coverUrl: body.coverUrl,
        colorTheme: body.colorTheme,
      });
    }

    return this.getStatus(userId);
  }

  async confirm(userId: string, _body: ConfirmStepDto) {
    const tenant = await this.requireTenantByOwnerId(userId);
    const workspaceType = this.getWorkspaceTypeOrThrow(tenant);
    const nextStep = getNextOnboardingStep(workspaceType, OnboardingStatus.CONFIRM);

    if (nextStep === OnboardingStatus.COMPLETED) {
      await this.tenantOnboardingRepository.finalizeAndActivateTenant(tenant.id);
    } else {
      await this.tenantOnboardingRepository.updateStatus(tenant.id, nextStep);
    }

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
