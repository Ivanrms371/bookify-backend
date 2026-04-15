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

  async findAllServicesByTenant(tenantId: string) {
    const services = await this.servicesRepository.findManyByTenant(tenantId);
    return services.map((service) => ({
      ...service,
      assignments: service.assignments.map((assignment) => assignment.staffId),
    }));
  }

  async findManyByIds(ids: string[]) {
    return this.servicesRepository.findManyByIds(ids);
  }

  async findServiceById(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdAndStaff(id: string, staffId: string) {
    const service = await this.servicesRepository.findByIdAndStaff(id, staffId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdOnlyTenantId(id: string) {
    const service = await this.servicesRepository.findByIdOnlyTenantId(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async createService(tenantId: string, data: CreateServiceDto, files?: { image?: Express.Multer.File[] }) {
    let imageUrl: string | undefined;
    if (files?.image?.[0]) {
      const result = await this.mediaService.upload(files.image[0], 'service', tenantId);
      imageUrl = result.url;
    }

    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0, staffIds, ...rest } = data;

    const durationMinutes = initialActiveMinutes + (passiveTimeMinutes ?? 0) + (finalActiveMinutes ?? 0);

    const service = await this.servicesRepository.create({
      ...rest,
      initialActiveMinutes,
      passiveTimeMinutes,
      finalActiveMinutes,
      image: imageUrl,
      tenant: { connect: { id: tenantId } },
      durationMinutes,
      ...(staffIds && staffIds.length > 0
        ? {
            assignments: {
              create: staffIds.map((staffId) => ({ staffId })),
            },
          }
        : {}),
    });

    await this.prisma.tenantOnboarding.update({
      where: { tenantId },
      data: { hasService: true },
    });

    return service;
  }

  async updateService(id: string, tenantId: string, data: UpdateServiceDto) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0, staffIds, ...rest } = data;
    const durationMinutes = initialActiveMinutes + passiveTimeMinutes + finalActiveMinutes;

    return await this.servicesRepository.update(id, {
      ...rest,
      initialActiveMinutes,
      passiveTimeMinutes,
      finalActiveMinutes,
      durationMinutes,
      ...(staffIds !== undefined
        ? {
            assignments: {
              deleteMany: {},
              create: staffIds.map((staffId) => ({ staffId })),
            },
          }
        : {}),
    });
  }

  async activateService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: true });
  }

  async deactivateService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: false });
  }

  async reorderServices(tenantId: string, orders: ReorderServiceDto[]) {}

  async softDeleteService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { deletedAt: new Date() });
  }
}
