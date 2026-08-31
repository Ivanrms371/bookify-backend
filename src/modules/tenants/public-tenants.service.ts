import { Injectable } from '@nestjs/common';
import { PublicTenantsRepository } from './repositories/public-tenants.repository';

@Injectable()
export class PublicTenantsService {
  constructor(private readonly publicTenantsRepo: PublicTenantsRepository) {}

  async findBySlug(slug: string) {
    return this.publicTenantsRepo.findBySlug(slug);
  }
}
