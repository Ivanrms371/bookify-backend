import { resolveLocationSelection, getLocationOptions } from 'src/shared/location/location-catalog';
import { LocationStepDto } from './dto/location-step.dto';
import { getLocationCountry, resolveLocationRegion } from 'src/shared/location/location-catalog';
import type { TenantOnboardingResponse } from './types/onboarding.types';
import { Injectable } from '@nestjs/common';
import type { Tenant } from 'src/generated/prisma/client';
import { OnboardingStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantOnboardingRepository } from './onboarding.repository';
import { OnboardingMapper } from './mappers/onboarding.mapper';
import { getNextOnboardingStep } from './config/get-next-onboarding-step';
import { ONBOARDING_STEP_ORDER, type StepId } from './config/onboarding-steps.config';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { ProfessionalStepDto } from './dto/professional-step.dto';
import { generateSlugTenant } from '../../utils/generate-slug.util';
import { DAY_OF_WEEK_TO_INT } from 'src/common/constants/day-of-week.constants';
import { timeToMinutes } from 'src/shared/schedule';
import { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { ProfessionalDraft } from './types/professional-draft.types';
import type { OnboardingMutation, OnboardingSaveOptions } from './types/onboarding-mutation.types';
import {
  OnboardingTenantNotFoundException,
  OnboardingStepUnavailableException,
  OnboardingProfileRequiredException,
  OnboardingServicesChangedException,
  OnboardingProfessionalConflictException,
  OnboardingProfileInvalidException,
  OnboardingConfirmationUnavailableException,
  OnboardingServicesInvalidException,
  OnboardingLocationRequiredException,
} from './exceptions/onboarding.exceptions';

@Injectable()
export class TenantOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantOnboardingRepository: TenantOnboardingRepository,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getStatus(ownerId: string, tenantId?: string): Promise<TenantOnboardingResponse> {
    return {
      ...OnboardingMapper.toResponse(await this.tenantOnboardingRepository.getStatus(ownerId, tenantId)),
      trial: this.subscriptionsService.getTrialDetails(),
    };
  }

  async initalize(ownerId: string) {
    if (!(await this.tenantOnboardingRepository.findByOwnerId(ownerId))) {
      await this.tenantOnboardingRepository.createInitialTenant(ownerId);
    }
    return this.getStatus(ownerId);
  }

  async updateBusiness(userId: string, dto: BusinessStepDto) {
    return this.saveStep(userId, 'BUSINESS_DETAILS', async (tenant, tx) => {
      const slug = tenant.name === dto.name && tenant.slug ? tenant.slug : await this.generateAvailableSlug(dto.name);
      await this.tenantOnboardingRepository.update(tenant.id, { name: dto.name, slug, type: dto.type }, tx);
    });
  }

  private prepareStudioLocation(dto: LocationStepDto) {
    const country = getLocationCountry(dto.country);
    const province = resolveLocationRegion(country.code, dto.province);
    const defaults = resolveLocationSelection(country.code, province.value);
    return {
      settings: { upsert: { create: defaults, update: defaults } },
      country: country.code,
      province: province.value,
      city: dto.city,
      addressLine1: dto.addressLine1,
      ...(dto.addressLine2 !== undefined ? { addressLine2: dto.addressLine2 || null } : {}),
      ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber || null } : {}),
    };
  }

  getLocationOptions() {
    return getLocationOptions();
  }

  async updateLocation(userId: string, tenantId: string, dto: LocationStepDto) {
    const location = this.prepareStudioLocation(dto);
    return this.saveStep(
      userId,
      'LOCATION',
      async (tenant, tx) => {
        await this.tenantOnboardingRepository.update(tenant.id, location, tx);
      },
      { tenantId },
    );
  }

  async updateServices(userId: string, dto: ServicesStepDto) {
    this.verifyServicesData(dto);
    return this.saveStep(userId, 'SERVICES', async (tenant, tx) => {
      const existing = await tx.service.findMany({ where: { tenantId: tenant.id }, select: { id: true } });
      const existingIds = new Set(existing.map((service) => service.id));
      if (dto.services.some((service) => service.id && !existingIds.has(service.id))) {
        throw new OnboardingServicesChangedException();
      }
      const retained = dto.services.flatMap((service) => (service.id ? [service.id] : []));
      await tx.service.deleteMany({ where: { tenantId: tenant.id, id: { notIn: retained } } });
      for (const service of dto.services) {
        const data = {
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
          ...(service.imageUrl !== undefined ? { imageUrl: service.imageUrl } : {}),
          ...(service.imagePublicId !== undefined ? { imagePublicId: service.imagePublicId } : {}),
        };
        if (service.id) await tx.service.update({ where: { id: service.id, tenantId: tenant.id }, data });
        else await tx.service.create({ data: { ...data, tenantId: tenant.id } });
      }
    });
  }

  async updateSchedule(userId: string, dto: ScheduleStepDto) {
    return this.saveStep(userId, 'SCHEDULE', async (tenant, tx) => {
      const schedules = dto.workingHours.flatMap((day) =>
        day.isActive
          ? day.intervals.map((interval) => ({
              tenantId: tenant.id,
              dayOfWeek: DAY_OF_WEEK_TO_INT[day.dayOfWeek],
              opensAt: timeToMinutes(interval.opensAt),
              closesAt: timeToMinutes(interval.closesAt),
            }))
          : [],
      );
      await this.tenantOnboardingRepository.replaceSchedules(tenant.id, schedules, tx);
    });
  }

  async updateProfessional(userId: string, dto: ProfessionalStepDto) {
    return this.saveStep(userId, 'PROFESSIONAL_PROFILE', async (tenant, tx) => {
      const draft: ProfessionalDraft = dto.attendsClients
        ? {
            attendsClients: true,
            name: dto.name,
            email: dto.email,
            phoneCountryCode: dto.phoneCountryCode,
            phoneNumber: dto.phoneNumber,
            ...(dto.profession ? { profession: dto.profession } : {}),
            serviceIds: dto.serviceIds,
          }
        : { attendsClients: false };
      await this.verifyProfileEligibility(tenant.id, userId, draft, tx);
      if (draft.attendsClients) await this.saveOwnerProfessional(tenant.id, userId, draft, tx);
      else await tx.professional.updateMany({ where: { tenantId: tenant.id, userId, deletedAt: null }, data: { isActive: false } });
      await this.tenantOnboardingRepository.update(tenant.id, { onboardingProfessionalDraft: draft }, tx);
    });
  }

  async updateCustomize(userId: string, dto: CustomizeStepDto) {
    return this.saveStep(userId, 'CUSTOMIZE', async (tenant, tx) => {
      await this.tenantOnboardingRepository.update(
        tenant.id,
        {
          logoUrl: dto.logoUrl,
          logoPublicId: dto.logoPublicId,
          coverUrl: dto.coverUrl,
          coverPublicId: dto.coverPublicId,
          colorTheme: dto.colorTheme,
        },
        tx,
      );
    });
  }

  async confirm(userId: string) {
    const tenant = await this.requireTenantByOwnerId(userId);
    if (tenant.onboardingStatus === OnboardingStatus.COMPLETED) return this.getStatus(userId);
    await this.prisma.$transaction(async (tx) => {
      const current = await this.tenantOnboardingRepository.lockTenant(tenant.id, tx);
      if (current.onboardingStatus === OnboardingStatus.COMPLETED) return;
      if (current.onboardingStatus !== OnboardingStatus.CONFIRM) throw new OnboardingConfirmationUnavailableException();
      this.verifyStudioLocation(current);
      const draft = current.onboardingProfessionalDraft as ProfessionalDraft | null;
      if (!draft || typeof draft.attendsClients !== 'boolean') throw new OnboardingProfileRequiredException();
      await this.verifyProfileEligibility(tenant.id, userId, draft, tx);
      if (!(await this.tenantOnboardingRepository.claimConfirmation(tenant.id, tx))) return;
      if (draft.attendsClients) {
        const activated = await tx.professional.updateMany({
          where: { tenantId: tenant.id, userId, deletedAt: null },
          data: { isActive: true },
        });
        if (activated.count !== 1) throw new OnboardingProfileRequiredException();
      }
      await this.tenantOnboardingRepository.completeOnboarding(
        tenant.id,
        tx,
        resolveLocationSelection(current.country!, current.province!),
      );
      await this.subscriptionsService.createTrialSubscription(tenant.id, tx);
    });
    return this.getStatus(userId);
  }

  private async saveStep(userId: string, step: StepId, action: OnboardingMutation, options: OnboardingSaveOptions = {}) {
    const { tenantId, advance = true } = options;
    const tenant = await this.requireTenantByOwnerId(userId, tenantId);
    await this.prisma.$transaction(async (tx) => {
      // Serialize edits with confirmation so stale requests cannot change a published tenant.
      const current = await this.tenantOnboardingRepository.lockTenant(tenant.id, tx);
      const currentIndex = ONBOARDING_STEP_ORDER.findIndex((id) => id === current.onboardingStatus);
      if (current.onboardingStatus === 'COMPLETED' || currentIndex < ONBOARDING_STEP_ORDER.indexOf(step)) {
        throw new OnboardingStepUnavailableException();
      }
      await action(current, tx);
      if (advance && current.onboardingStatus === step) {
        await this.tenantOnboardingRepository.updateStatus(tenant.id, getNextOnboardingStep(step), tx);
      }
    });
    return this.getStatus(userId, tenantId);
  }

  private verifyStudioLocation(tenant: Tenant) {
    if (![tenant.country, tenant.province, tenant.city, tenant.addressLine1].every((value) => value?.trim())) {
      throw new OnboardingLocationRequiredException();
    }
    resolveLocationRegion(tenant.country!, tenant.province!);
  }

  private verifyServicesData(dto: ServicesStepDto) {
    const ids = dto.services.flatMap((service) => (service.id ? [service.id] : []));
    const hasInvalidService = dto.services.some(
      (service) =>
        !service.name.trim() ||
        !Number.isFinite(Number(service.price)) ||
        Number(service.price) < 0 ||
        !Number.isInteger(service.durationMinutes) ||
        service.durationMinutes <= 0,
    );
    if (!dto.services.length || hasInvalidService || new Set(ids).size !== ids.length) {
      throw new OnboardingServicesInvalidException();
    }
  }

  private async verifyProfileEligibility(tenantId: string, userId: string, draft: ProfessionalDraft, tx: TransactionClient) {
    if (!draft.attendsClients) return;
    if (!draft.name?.trim() || !draft.email || !draft.phoneCountryCode || !draft.phoneNumber || !draft.serviceIds?.length) {
      throw new OnboardingProfileInvalidException();
    }
    const services = await tx.service.count({ where: { id: { in: draft.serviceIds }, tenantId, deletedAt: null, isActive: true } });
    if (services !== new Set(draft.serviceIds).size) throw new OnboardingServicesChangedException();
    await this.tenantOnboardingRepository.lockOwner(userId, tx);
    const existing = await tx.professional.findUnique({ where: { userId } });
    if (existing && (existing.tenantId !== tenantId || existing.deletedAt)) throw new OnboardingProfessionalConflictException();
  }

  private async saveOwnerProfessional(tenantId: string, userId: string, draft: ProfessionalDraft, tx: TransactionClient) {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarUrl: true } });
    const data = {
      name: draft.name!,
      email: draft.email!,
      phoneCountryCode: draft.phoneCountryCode!,
      phoneNumber: draft.phoneNumber!,
      profession: draft.profession ?? null,
      isActive: false,
    };
    const professional = await tx.professional.upsert({
      where: { userId },
      create: { ...data, tenantId, userId, avatarUrl: user.avatarUrl },
      update: data,
    });
    await tx.serviceAssignment.deleteMany({ where: { professionalId: professional.id } });
    await tx.serviceAssignment.createMany({
      data: draft.serviceIds!.map((serviceId) => ({ professionalId: professional.id, serviceId, isActive: true })),
    });
  }

  private async requireTenantByOwnerId(userId: string, tenantId?: string): Promise<Tenant> {
    const tenant = await this.tenantOnboardingRepository.findByOwnerId(userId, tenantId);
    if (!tenant) throw new OnboardingTenantNotFoundException();
    return tenant;
  }

  private async generateAvailableSlug(name: string): Promise<string> {
    const baseSlug =
      generateSlugTenant(name)
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'business';
    if (!(await this.tenantOnboardingRepository.findBySlug(baseSlug))) return baseSlug;
    while (true) {
      const candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
      if (!(await this.tenantOnboardingRepository.findBySlug(candidate))) return candidate;
    }
  }
}
