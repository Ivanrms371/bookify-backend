import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessesRepository } from './repositories/businesses.repository';
import { MembersService } from './features/members/members.service';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly businessesRepository: BusinessesRepository,
    private readonly membersService: MembersService,
  ) {}

  async findBusinessByIdAndValidate(userId: string, businessId: string) {
    const business = await this.businessesRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    const member = this.membersService.findByUserAndBusiness(userId, businessId);
    if (!member) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      isActive: business.isActive,
      isPublic: business.isPublic,
      onboardingCompleted: business.onboardingCompleted,
      onboardingSteps: business.onboarding
        ? {
            workingHours: business.onboarding.hasSchedule,
            service: business.onboarding.hasService,
            team: business.onboarding.hasStaff,
            published: business.isPublic,
          }
        : {
            workingHours: false,
            service: false,
            team: false,
            published: business.isPublic,
          },
      ownerId: business.ownerId,
      logoUrl: business.logoUrl,
      description: business.description,
    };
  }

  async findAllBusinessByUser(userId: string) {
    return this.businessesRepository.findAllBusinessesByUser(userId);
  }

  async findBusinessById(businessId: string) {
    const business = await this.businessesRepository.findById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    return business;
  }

  async updateBusinessStatus(businessId: string, isPublic: boolean) {
    const business = await this.businessesRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    return this.businessesRepository.update({
      where: { id: businessId },
      data: { isPublic },
    });
  }
}
