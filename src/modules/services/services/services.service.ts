import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SubscriptionService } from 'src/modules/subscriptions/services/subscription.service';
import { MediaService } from 'src/shared/media/media.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PlanType } from 'src/generated/prisma/enums';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  findAllServicesByBusiness(businessId: string) {
    return this.servicesRepository.findManyByBusiness(businessId);
  }

  async findServiceById(id: string) {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdOnlyBusinessId(id: string) {
    const service = await this.servicesRepository.findByIdOnlyBusinessId(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async createService(
    businessId: string,
    data: CreateServiceDto,
    files?: { image?: Express.Multer.File[] },
  ) {
    const subscription = await this.subscriptionService.findByBusinessId(businessId);
    if (subscription?.plan?.planType === PlanType.FREE) {
      const count = await this.servicesRepository.countByBusiness(businessId);
      if (count >= 1) {
        throw new ForbiddenException(
          'El plan gratuito solo permite crear 1 servicio. Por favor, actualiza a Pro o Team.',
        );
      }
    }

    let imageUrl: string | undefined;
    if (files?.image?.[0]) {
      const result = await this.mediaService.upload(
        files.image[0],
        'service',
        businessId,
      );
      imageUrl = result.url;
    }

    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0 } = data;

    const durationMinutes = initialActiveMinutes + (passiveTimeMinutes ?? 0) + (finalActiveMinutes ?? 0);

    const service = await this.servicesRepository.create({
      ...data,
      image: imageUrl,
      business: { connect: { id: businessId } },
      durationMinutes,
    });

    await this.prisma.businessOnboarding.update({
      where: { businessId },
      data: { hasService: true },
    });

    return service;
  }

  async updateService(id: string, businessId: string, data: UpdateServiceDto) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0 } = data;
    const durationMinutes = initialActiveMinutes + passiveTimeMinutes + finalActiveMinutes;

    return await this.servicesRepository.update(id, {
      ...data,
      durationMinutes,
    });
  }

  async activateService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: true });
  }

  async deactivateService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: false });
  }

  async reorderServices(businessId: string, orders: ReorderServiceDto[]) {}

  async softDeleteService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { deletedAt: new Date() });
  }
}
