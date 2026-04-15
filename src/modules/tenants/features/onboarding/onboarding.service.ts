import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { RESERVED_SLUGS } from 'src/common/constants/reserved-slug.constants';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SubscriptionService } from 'src/modules/subscriptions/services/subscription.service';
import { OnboardingRepository } from './onboarding.repository';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { PlansService } from 'src/modules/plans/plans.service';
import { PlanType } from 'src/generated/prisma/enums';
import { OnboardingStatusMapper } from './mappers/onboarding-status.mapper';
import { MediaService } from 'src/shared/media/media.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { MembershipsService } from '../memberships/memberships.service';
import { SetupOnboardingDto } from './dto/setup-onboarding.dto';
import EventEmitter2 from 'eventemitter2';
import { TenantCreatedEvent } from '../../events/tenant-created.event';
import { TenantQuotaService } from '../quota/tenant-quota.service';
import { StaffsService } from 'src/modules/tenants/features/staffs/staffs.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaService: MediaService,
    private readonly planService: PlansService,
    private readonly membershipsService: MembershipsService,
    private readonly subscriptionService: SubscriptionService,
    private readonly onboardingRepository: OnboardingRepository,
    private readonly tenantQuotaService: TenantQuotaService,
    private readonly staffsService: StaffsService,
  ) {}

  async setupOnboarding(userId: string, userName: string, dto: SetupOnboardingDto) {
    const cleanSlug = slugify(dto.slug || dto.name, { lower: true, strict: true });

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      throw new BadRequestException('La URL de tu negocio no puede ser ', cleanSlug);
    }

    const exists = await this.onboardingRepository.findBySlug(cleanSlug);
    if (exists) {
      throw new BadRequestException('Esta URL ya está siendo usada por otro negocio.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.onboardingRepository.setup(
        {
          ownerId: userId,
          name: dto.name,
          slug: cleanSlug,
        },
        tx,
      );

      const member = await this.membershipsService.createOwner(tenant.id, userId, tx);

      const freePlan = await this.planService.findPlanByType(PlanType.FREE);
      if (freePlan && freePlan.limits) {
        await this.tenantQuotaService.create(
          tenant.id,
          {
            professionalCount: 1,
            appointmentLimit: freePlan.limits.appointmentLimit,
            professionalLimit: freePlan.limits.professionalLimit,
            emailLimit: freePlan.limits.emailLimit,
            whatsappLimit: freePlan.limits.whatsappLimit,
          },
          tx,
        );
      }

      await this.staffsService.createOwnerProfile(tenant.id, userId, userName, tx);

      return { tenant, member };
    });

    this.eventEmitter.emit('tenant.created', {
      userId,
      tenantId: result.tenant.id,
      userName: userName,
      tenantName: result.tenant.name,
    } as TenantCreatedEvent);

    return result;
  }

  async getOnboardingStatus(userId: string) {
    const status = await this.onboardingRepository.getOnboardingStatus(userId);

    return OnboardingStatusMapper.toDto(status);
  }

  async selectPlan(tenantId: string, userId: string, dto: SelectPlanDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.onboardingRepository.findByIdAndOwnerId(tenantId, userId, tx);

      if (!tenant) {
        console.log('Tenant no encontrado');
        throw new NotFoundException('No se ha encontrado el negocio');
      }

      const plan = await this.planService.findPlanByType(dto.plan);

      if (!plan || !plan.limits) {
        throw new NotFoundException('Plan no encontrado');
      }

      await this.subscriptionService.createSubscription(tenant.id, dto.plan, tx);

      await this.tenantQuotaService.updateLimits(tenant.id, plan.limits, tx);

      return tenant;
    });
    return result;
  }

  async getChecklist(tenantId: string, userId: string) {
    const tenant = await this.onboardingRepository.findByIdAndOwnerId(tenantId, userId);
    if (!tenant) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const onboarding = await this.onboardingRepository.findByTenantId(tenant.id);

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const subscription = await this.subscriptionService.findByTenantId(tenant.id);

    const planType = subscription?.plan?.planType || PlanType.FREE;

    const steps = {
      address: !!tenant.addressLine1,
      availability: onboarding.hasSchedule,
      tenantImages: !!(tenant.logoUrl || tenant.coverUrl),
      serviceCreate: onboarding.hasService,
      ...(planType === PlanType.TEAM ? { inviteTeam: onboarding.hasStaff } : {}),
      publishTenant: onboarding.onboardingCompleted,
    };

    const isCompleted = onboarding.onboardingCompleted;

    const paymentProvider = subscription?.paymentProvider ?? null;

    return {
      plan: planType,
      steps,
      isCompleted,
      paymentProvider,
    };
  }

  async completeOnboarding(tenantId: string, userId: string) {
    const checklist = await this.getChecklist(tenantId, userId);

    const stepsToValidate = { ...checklist.steps } as Record<string, boolean>;
    delete stepsToValidate.publishTenant;

    const pendingSteps = Object.values(stepsToValidate).some((step) => step === false);
    if (pendingSteps) {
      throw new BadRequestException('Aún hay pasos pendientes en la lista de tareas.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTenant = await this.onboardingRepository.markOnboardingAsCompleted(tenantId, tx);

      await this.onboardingRepository.updateOnboardingCompleted(tenantId, true, tx);

      return updatedTenant;
    });

    return result;
  }

  async updateAddress(tenantId: string, onwerId: string, dto: UpdateTenantAddressDto) {
    const tenant = await this.onboardingRepository.findByIdAndOwnerId(tenantId, onwerId);
    if (!tenant) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return await this.onboardingRepository.update(tenantId, {
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      phone: dto.phone,
    });
  }

  async updateAvailability(tenantId: string, userId: string, dto: UpdateAvailabilityDto) {
    const tenant = await this.onboardingRepository.findByIdAndOwnerId(tenantId, userId);

    if (!tenant) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const updatedTenant = await this.prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({
        where: { tenantId },
      });

      if (dto.workingHours && dto.workingHours.length > 0) {
        await tx.workingHours.createMany({
          data: dto.workingHours.map((wh) => ({
            tenantId,
            dayOfWeek: wh.dayOfWeek,
            startMinutes: wh.startMinutes,
            endMinutes: wh.endMinutes,
            name: wh.name,
            isActive: true,
          })),
        });
      }

      await tx.tenantOnboarding.update({
        where: { tenantId },
        data: { hasSchedule: true },
      });

      return tenant;
    });

    return updatedTenant;
  }

  async updateAssets(tenantId: string, userId: string, files: { logo?: Express.Multer.File[]; banner?: Express.Multer.File[] }) {
    const tenant = await this.onboardingRepository.findByIdAndOwnerId(tenantId, userId);

    if (!tenant) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const assets: {
      logoUrl?: string | null;
      logoPublicId?: string | null;
      coverUrl?: string | null;
      coverPublicId?: string | null;
    } = {};

    if (files.logo?.[0]) {
      const { url, publicId } = await this.mediaService.upload(files.logo[0], 'logo', tenantId);
      assets.logoUrl = url;
      assets.logoPublicId = publicId;
    }

    if (files.banner?.[0]) {
      const { url, publicId } = await this.mediaService.upload(files.banner[0], 'cover', tenantId);
      assets.coverUrl = url;
      assets.coverPublicId = publicId;
    }

    if (Object.keys(assets).length === 0) {
      return tenant;
    }

    const updatedTenant = await this.onboardingRepository.updateTenantAssets(tenantId, assets);

    return updatedTenant;
  }
}
