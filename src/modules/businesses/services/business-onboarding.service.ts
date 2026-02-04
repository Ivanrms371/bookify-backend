import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRepository } from '../repositories/business.repository';
import {
  OnboardingBusinessStep1DTO,
  OnboardingBusinessStep2DTO,
  OnboardingBusinessStep3DTO,
} from '../dto/onboarding.dto';
import { generateSlugBusiness } from '../utils/generate-slug.util';
import { BusinessImagesService } from './business-images.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class BusinessOnboardingService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly businessImagesService: BusinessImagesService,
  ) {}

  async getBusinessOnboarding(userId: string, businessId: string) {
    const business = await this.businessRepository.findUnique({
      where: { ownerId: userId, id: businessId },
    });

    if (!business) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    return business;
  }

  async onboardingBusinessStep1(
    data: OnboardingBusinessStep1DTO,
    userId: string,
    businessId: string,
  ) {
    const { name, slug, description, type } = data;
    const nextStep = 2;

    const slugGenerated = generateSlugBusiness(slug || name);
    const existingBusiness = await this.businessRepository.findUnique({
      where: { slug: slugGenerated },
    });

    if (existingBusiness && existingBusiness.ownerId !== userId) {
      throw new BadRequestException('Esa URL ya esta en uso');
    }

    const business = await this.businessRepository.update({
      where: { ownerId: userId, id: businessId },
      data: {
        name,
        slug: slugGenerated,
        description,
        type,
        onboardingStep: nextStep,
      },
    });

    return business;
  }

  async onboardingBusinessStep2(
    data: OnboardingBusinessStep2DTO,
    userId: string,
    businessId: string,
  ) {
    const { addressLine1, addressLine2, phone } = data;
    const nextStep = 3;

    return await this.businessRepository.update({
      where: { ownerId: userId, id: businessId },
      data: {
        addressLine1,
        addressLine2,
        phone,
        onboardingStep: nextStep,
      },
    });
  }

  async onboardingBusinessStep3(
    data: OnboardingBusinessStep3DTO,
    userId: string,
    businessId: string,
  ) {
    const { logo, cover } = data;
    const nextStep = 4;

    // 1. Delete old images
    const business = await this.businessRepository.findUnique({ where: { id: businessId } });
    const deleteFiles: string[] = [];
    if (logo && business?.logoPublicId) {
      deleteFiles.push(business.logoPublicId);
    }
    if (cover && business?.coverPublicId) {
      deleteFiles.push(business.coverPublicId);
    }
    if (deleteFiles.length > 0) {
      await this.businessImagesService.deleteOnboardingImages(deleteFiles);
    }

    // 2. Upload to cloudinary
    const uploadResult = await this.businessImagesService.uploadOnboardingImages({ logo, cover });
    try {
      // 3. Try save in db
      const business = await this.businessRepository.update({
        where: { id: businessId, ownerId: userId },
        data: {
          logoUrl: uploadResult.logo?.url,
          logoPublicId: uploadResult.logo?.public_id,
          coverUrl: uploadResult.cover?.url,
          coverPublicId: uploadResult.cover?.public_id,
          onboardingStep: nextStep,
        },
      });
      return {
        status: 'success',
        data: { business, uploadResult },
      };
    } catch (error) {
      // 4. rollback, if db fails, delete images from cloudinary
      const publicIds = [uploadResult.logo?.public_id, uploadResult.cover?.public_id].filter(
        (id) => id !== undefined,
      );
      if (publicIds.length > 0) {
        await this.businessImagesService.deleteOnboardingImages(publicIds);
      }
      // throw exception from NestJS to Global Exception Filter
      throw new InternalServerErrorException({
        message: 'No se pudo vincular las imágenes al negocio. Inténtalo de nuevo.',
        error: error.message,
      });
    }
  }

  async markOnboardingAsCompleted(businessId: string, tx?: Prisma.TransactionClient) {
    await this.businessRepository.update(
      {
        where: { id: businessId },
        data: {
          onboardingCompleted: true,
        },
      },
      tx,
    );
  }
}
