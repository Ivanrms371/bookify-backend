import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicTenantsService } from './public-tenants.service';

@Controller('public/tenants')
export class PublicTenantsController {
  constructor(private readonly publicTenantsService: PublicTenantsService) {}
  @Get(':slug')
  async getTenantBySlug(@Param('slug') slug: string) {
    console.log(slug);
    return this.publicTenantsService.findBySlug(slug);
  }
}
