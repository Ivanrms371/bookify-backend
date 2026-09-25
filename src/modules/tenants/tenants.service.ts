import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  findBySlug(tenantSlug: string) {
    return this.tenantsRepository.findBySlug(tenantSlug);
  }

  findPublicBySlug(tenantSlug: string) {
    return this.tenantsRepository.findPublicBySlug(tenantSlug);
  }

  async findById(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }
}
