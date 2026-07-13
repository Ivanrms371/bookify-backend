import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './repositories/tenants.repository';
import { MembershipsService } from './features/memberships/memberships.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { generateSlugTenant } from './utils/generate-slug.util';
import { mapOnboardingStatus } from './mappers/onboarding-status.mapper';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly membershipsService: MembershipsService,
  ) {}

  async findTenantByIdAndValidate(userId: string, tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    const member = await this.membershipsService.findByUserAndTenant(userId, tenantId);
    if (!member) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }
  }

  async findTenantById(tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantsRepository.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }
    return tenant;
  }

  async createTenant(userId: string, data: CreateTenantDto) {
    const slug = generateSlugTenant(data.slug);
    const tenantExists = await this.tenantsRepository.findBySlug(slug);
    if (tenantExists) {
      throw new BadRequestException('La URL ya existe');
    }
    return await this.tenantsRepository.create(userId, { ...data, slug });
  }

  async getOnboardingStatus(userId: string) {
    const tenantId = await this.tenantsRepository.findByUserId(userId);
    if (!tenantId) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }
    // return mapOnboardingStatus(tenantId);
  }

  async updateAddress(tenantId: string, dto: UpdateTenantAddressDto) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }
    return this.tenantsRepository.updateAddress(tenantId, dto);
  }

  async completeOnboarding(tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    const updated = await this.tenantsRepository.markOnboardingAsCompleted(tenantId);
    return { onboardingStatus: updated.onboardingStatus };
  }
}
