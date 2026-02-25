import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { BusinessImagesService } from '../../core/business-images.service';
import { SelectPlanDto, UpdateAssetsDto, UpdateLocationDto, UpdateProfileDto } from '../../core/dto/onboarding.dto';
import slugify from 'slugify';
import { RESERVED_SLUGS } from 'src/common/constants/reserved-slug.constants';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SubscriptionService } from 'src/modules/subscriptions/services/subscription.service';
import { OnboardingRepository } from './onboarding.repository';
import { PlansService } from 'src/modules/plans/plans.service';
import { BusinessLimitsService } from '../limits/business-limits.service';
import { SettingsService } from '../settings/settings.service';
import { BusinessStatsService } from '../stats/business-stats.service';
import { MembersService } from '../members/members.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlansService,
    private readonly membersService: MembersService,
    private readonly subscriptionService: SubscriptionService,
    private readonly businessLimitsService: BusinessLimitsService,
    private readonly settingsService: SettingsService,
    private readonly onboardingRepository: OnboardingRepository,
  ) {}

  async getOnboardingStatus(userId: string) {
    const business = await this.onboardingRepository.findByOwnerId(userId);

    if (!business) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    return business;
  }

  async initializeBusiness(userId: string) {
    const business = await this.onboardingRepository.findByOwnerId(userId);

    if (business) {
      throw new BadRequestException('Ya tienes un negocio creado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const business = await this.onboardingRepository.initialize(userId);

      const member = await this.membersService.createOwner(business.id, userId, tx);

      return { business, member };
    });
  }

  async updateProfile(dto: UpdateProfileDto, userId: string) {
    const { name, slug, description, type } = dto;
    const cleanSlug = slugify(slug || name, { lower: true, strict: true });

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      throw new BadRequestException('El nombre de tu negocio no puede ser ', cleanSlug);
    }

    const exists = await this.onboardingRepository.findBySlug(cleanSlug);

    if (exists) {
      throw new BadRequestException('Esta URL ya está siendo usada por otro negocio.');
    }

    const nextStep = 2;
    return this.onboardingRepository.updateByOwnerId(userId, {
      onboardingStep: nextStep,
      slug: cleanSlug,
      name,
      description,
      type,
    });
  }

  async updateLocation(dto: UpdateLocationDto, userId: string) {
    const { addressLine1, addressLine2, phone } = dto;

    const nextStep = 3;
    return await this.onboardingRepository.updateByOwnerId(userId, {
      onboardingStep: nextStep,
      addressLine1,
      addressLine2,
      phone,
    });
  }

  async updateAssets(dto: UpdateAssetsDto, userId: string) {
    const { logo, cover } = dto;

    // 1. Delete old images
    const business = await this.onboardingRepository.findByOwnerId(userId);
    if (!business) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    const deleteFiles: string[] = [];
    if (logo && business?.logoPublicId) {
      deleteFiles.push(business.logoPublicId);
    }
    if (cover && business?.coverPublicId) {
      deleteFiles.push(business.coverPublicId);
    }
    if (deleteFiles.length > 0) {
      // await this.businessImagesService.deleteOnboardingImages(deleteFiles);
    }

    // 2. Upload to cloudinary
    // const uploadResult = await this.businessImagesService.uploadOnboardingImages({ logo, cover });
    // try {
    //   const nextStep = 4;
    //   // 3. Try save in db
    //   const business = await this.onboardingRepository.updateByOwnerId(userId, {
    //     logoUrl: uploadResult.logo?.url,
    //     logoPublicId: uploadResult.logo?.public_id,
    //     coverUrl: uploadResult.cover?.url,
    //     coverPublicId: uploadResult.cover?.public_id,
    //     onboardingStep: nextStep,
    //   });
    //   return {
    //     status: 'success',
    //     data: { business, uploadResult },
    //   };
    // } catch (error) {
    //   // 4. rollback, if db fails, delete images from cloudinary
    //   const publicIds = [uploadResult.logo?.public_id, uploadResult.cover?.public_id].filter((id) => id !== undefined);
    //   if (publicIds.length > 0) {
    //     await this.businessImagesService.deleteOnboardingImages(publicIds);
    //   }
    //   // throw exception from NestJS to Global Exception Filter
    //   throw new InternalServerErrorException({
    //     message: 'No se pudo vincular las imágenes al negocio. Inténtalo de nuevo.',
    //     error: error.message,
    //   });
    // }
  }

  async completeOnboarding(dto: SelectPlanDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const business = await this.onboardingRepository.findByOwnerId(userId);

      if (!business) {
        throw new NotFoundException('No se ha encontrado el negocio');
      }

      const plan = await this.planService.findPlanByKey(dto.planType);

      if (!plan || !plan.limits) {
        throw new NotFoundException('Plan no encontrado');
      }

      const subscription = this.subscriptionService.createSubscription(business.id, dto.planType, tx);

      const limits = this.businessLimitsService.create(
        business.id,
        {
          appointmentLimit: plan.limits.appointmentLimit,
          emailLimit: plan.limits.emailLimit,
          professionalLimit: plan.limits.professionalLimit,
          whatsappLimit: plan.limits.whatsappLimit,
        },
        tx,
      );

      const settings = this.settingsService.create(business.id, tx);

      await Promise.all([subscription, limits, settings]);

      const businessSaved = await this.onboardingRepository.markOnboardingAsCompleted(userId, tx);

      return businessSaved;
    });
    return result;
  }
}
