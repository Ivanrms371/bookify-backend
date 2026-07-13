import { Controller, Get, Param, Patch, Body, ParseUUIDPipe, Req, UseGuards, Post, Put } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async createTenant(@Req() req: AuthenticatedRequest, @Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(req.user.userId, dto);
  }

  @Get('onboarding/status')
  async getOnboardingStatus(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.getOnboardingStatus(req.user.userId);
  }

  @Post(':tenantId/onboarding/complete')
  @UseGuards(TenantGuard)
  async completeOnboarding(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.completeOnboarding(req.tenant.id);
  }

  @Get(':tenantId')
  async getTenant(@Req() req: AuthenticatedRequest, @Param('tenantId', new ParseUUIDPipe()) tenantId: string) {
    const userId = req.user.userId;
    return this.tenantsService.findTenantByIdAndValidate(userId, tenantId);
  }

  @Put(':tenantId/address')
  @UseGuards(TenantGuard)
  async updateTenantAddress(
    @Req() req: AuthenticatedRequest,
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: UpdateTenantAddressDto,
  ) {
    return this.tenantsService.updateAddress(tenantId, dto);
  }

  @Get('/slug/:slug')
  async getTenantBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }
}
