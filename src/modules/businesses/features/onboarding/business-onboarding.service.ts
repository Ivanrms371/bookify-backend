import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SelectPlanDto } from '../../core/dto/onboarding.dto';
import slugify from 'slugify';
import { RESERVED_SLUGS } from 'src/common/constants/reserved-slug.constants';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SubscriptionService } from 'src/modules/subscriptions/services/subscription.service';
import { BusinessOnboardingRepository } from './business-onboarding.repository';
import { MembersService } from '../members/members.service';
import { InitOnboardingDto } from './dto/init-onboarding.dto';
import { UpdateBusinessAddressDto } from './dto/update-business-address.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { PlansService } from 'src/modules/plans/plans.service';
import { PlanType } from 'src/generated/prisma/enums';
import { OnboardingStatusMapper } from './mappers/onboarding-status.mapper';
import { MediaService } from 'src/shared/media/media.service';

@Injectable()
export class BusinessOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlansService,
    private readonly membersService: MembersService,
    private readonly subscriptionService: SubscriptionService,
    private readonly businessOnboardingRepository: BusinessOnboardingRepository,
    private readonly mediaService: MediaService,
  ) {}

  async initializeBusiness(userId: string, dto: InitOnboardingDto) {
    const business = await this.businessOnboardingRepository.findByOwnerId(userId);

    if (business) {
      throw new BadRequestException('Ya tienes un negocio creado.');
    }

    const cleanSlug = slugify(dto.slug || dto.name, { lower: true, strict: true });

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      throw new BadRequestException('La URL de tu negocio no puede ser ', cleanSlug);
    }

    const exists = await this.businessOnboardingRepository.findBySlug(cleanSlug);
    if (exists) {
      throw new BadRequestException('Esta URL ya está siendo usada por otro negocio.');
    }

    return this.prisma.$transaction(async (tx) => {
      const business = await this.businessOnboardingRepository.create(
        {
          owner: {
            connect: {
              id: userId,
            },
          },
          name: dto.name,
          slug: cleanSlug,
          onboarding: {
            create: {},
          },
          settings: {
            create: {},
          },
          lifetimeStats: {
            create: {},
          },
        },
        tx,
      );

      const member = await this.membersService.createOwner(business.id, userId, tx);

      return { business, member };
    });
  }

  async getOnboardingStatus(userId: string) {
    const status = await this.businessOnboardingRepository.getOnboardingStatus(userId);

    return OnboardingStatusMapper.toDto(status);
  }

  async selectPlan(businessId: string, userId: string, dto: SelectPlanDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const business = await this.businessOnboardingRepository.findByIdAndOwner(businessId, userId, tx);

      if (!business) {
        console.log('Business no encontrado');
        throw new NotFoundException('No se ha encontrado el negocio');
      }

      const plan = await this.planService.findPlanByKey(dto.planType);

      console.log('Plan', plan);

      if (!plan || !plan.limits) {
        console.log('Plan no encontrado');
        throw new NotFoundException('Plan no encontrado');
      }

      const subscription = await this.subscriptionService.createSubscription(business.id, dto.planType, tx);

      return {
        business,
        subscription,
      };
    });
    return result;
  }

  async getChecklist(businessId: string, userId: string) {
    const business = await this.businessOnboardingRepository.findByIdAndOwner(businessId, userId);
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const onboarding = await this.businessOnboardingRepository.findByBusinessId(business.id);

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const subscription = await this.subscriptionService.findByBusinessId(business.id);

    const planType = subscription?.plan?.planType || PlanType.FREE;

    const steps = {
      address: !!business.addressLine1,
      availability: onboarding.hasSchedule,
      businessImages: !!(business.logoUrl || business.coverUrl),
      serviceCreate: onboarding.hasService,
      ...(planType === PlanType.TEAM ? { inviteTeam: onboarding.hasStaff } : {}),
      publishBusiness: onboarding.onboardingCompleted,
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

  async completeOnboarding(businessId: string, userId: string) {
    const checklist = await this.getChecklist(businessId, userId);

    const stepsToValidate = { ...checklist.steps } as Record<string, boolean>;
    delete stepsToValidate.publishBusiness;

    const pendingSteps = Object.values(stepsToValidate).some((step) => step === false);
    if (pendingSteps) {
      throw new BadRequestException('Aún hay pasos pendientes en el checklist de onboarding.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBusiness = await this.businessOnboardingRepository.markOnboardingAsCompleted(userId, tx);

      await this.businessOnboardingRepository.updateOnboardingCompleted(businessId, true, tx);

      return updatedBusiness;
    });

    return result;
  }

  async updateAddress(businessId: string, userId: string, dto: UpdateBusinessAddressDto) {
    const business = await this.businessOnboardingRepository.findByIdAndOwner(businessId, userId);

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const updatedBusiness = await this.businessOnboardingRepository.updateByOwnerId(userId, {
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      phone: dto.phone,
    });

    return updatedBusiness;
  }

  async updateAvailability(businessId: string, userId: string, dto: UpdateAvailabilityDto) {
    const business = await this.businessOnboardingRepository.findByIdAndOwner(businessId, userId);

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const updatedBusiness = await this.prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({
        where: { businessId },
      });

      if (dto.workingHours && dto.workingHours.length > 0) {
        await tx.workingHours.createMany({
          data: dto.workingHours.map((wh) => ({
            businessId,
            dayOfWeek: wh.dayOfWeek,
            startMinutes: wh.startMinutes,
            endMinutes: wh.endMinutes,
            name: wh.name,
            isActive: true,
          })),
        });
      }

      await tx.businessOnboarding.update({
        where: { businessId },
        data: { hasSchedule: true },
      });

      return business;
    });

    return updatedBusiness;
  }

  async updateAssets(
    businessId: string,
    userId: string,
    files: { logo?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const business = await this.businessOnboardingRepository.findByIdAndOwner(businessId, userId);

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const assets: {
      logoUrl?: string | null;
      logoPublicId?: string | null;
      coverUrl?: string | null;
      coverPublicId?: string | null;
    } = {};

    if (files.logo?.[0]) {
      const { url, publicId } = await this.mediaService.upload(
        files.logo[0],
        'logo',
        businessId,
      );
      assets.logoUrl = url;
      assets.logoPublicId = publicId;
    }

    if (files.banner?.[0]) {
      const { url, publicId } = await this.mediaService.upload(
        files.banner[0],
        'cover',
        businessId,
      );
      assets.coverUrl = url;
      assets.coverPublicId = publicId;
    }

    if (Object.keys(assets).length === 0) {
      return business;
    }

    const updatedBusiness = await this.businessOnboardingRepository.updateBusinessAssets(
      businessId,
      assets,
    );

    return updatedBusiness;
  }
}
