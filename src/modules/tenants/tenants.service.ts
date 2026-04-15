import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './repositories/tenants.repository';
import { MembershipsService } from './features/memberships/memberships.service';

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

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      isPublic: tenant.isPublic,
      onboardingCompleted: tenant.onboardingCompleted,
      onboardingSteps: tenant.onboarding
        ? {
            workingHours: tenant.onboarding.hasSchedule,
            service: tenant.onboarding.hasService,
            team: tenant.onboarding.hasStaff,
            published: tenant.isPublic,
          }
        : {
            workingHours: false,
            service: false,
            team: false,
            published: tenant.isPublic,
          },
      ownerId: tenant.ownerId,
      logoUrl: tenant.logoUrl,
      description: tenant.description,
    };
  }

  async findAllTenantByUser(userId: string) {
    return this.tenantsRepository.findAllTenantesByUser(userId);
  }

  async findTenantById(tenantId: string) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    return tenant;
  }

  async updateTenantStatus(tenantId: string, isPublic: boolean) {
    const tenant = await this.tenantsRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('No se ha encontrado el negocio');
    }

    return this.tenantsRepository.update({
      where: { id: tenantId },
      data: { isPublic },
    });
  }
}
