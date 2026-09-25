import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicRepository } from './public.repository';
import { AvailabilityService } from '../availability/availability.service';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly publicRepository: PublicRepository,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async getTenantBySlug(slug: string) {
    const tenant = await this.publicRepository.findTenantBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }
    return tenant;
  }

  async getServices(tenantId: string) {
    return this.publicRepository.findAllServices(tenantId);
  }

  async getServicesByProfessional(professionalId: string) {
    return this.publicRepository.findAllServicesByProfessional(professionalId);
  }

  async getProfessionals(tenantId: string) {
    return this.publicRepository.findAllProfessionals(tenantId);
  }

  async getProfessionalsByService(serviceId: string) {
    return this.publicRepository.findAllProfessionalsByService(serviceId);
  }
}
