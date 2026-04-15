import { Body, Controller, Get, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { OnboardingService } from './onboarding.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { UpdateTenantAddressDto } from './dto/update-tenant-address.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRole } from 'src/generated/prisma/enums';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { SetupOnboardingDto } from './dto/setup-onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  async getOnboardingStatus(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.getOnboardingStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup')
  async setupOnboarding(@Req() req: AuthenticatedRequest, @Body() dto: SetupOnboardingDto) {
    try {
      const { userId, name } = req.user;
    return this.onboardingService.setupOnboarding(userId, name, dto);
    } catch (error) {
      console.log(error.stack)
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER)
  @Post('/tenants/:tenantId/select-plan')
  async selectPlan(@Req() req: AuthenticatedRequest, @Body() dto: SelectPlanDto) {
    const { tenantId } = req.params;
    const { userId } = req.user;
    return this.onboardingService.selectPlan(tenantId, userId, dto);
  }

  @Get('/tenants/:tenantId/checklist')
  async getChecklist(@Req() req: AuthenticatedRequest) {
    const { tenantId } = req.params;
    const { userId } = req.user;
    return this.onboardingService.getChecklist(tenantId, userId);
  }

  @Post('/tenants/:tenantId/complete')
  async completeOnboarding(@Req() req: AuthenticatedRequest) {
    const { tenantId } = req.params;
    const { userId } = req.user;
    return this.onboardingService.completeOnboarding(tenantId, userId);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @MembershipRoles(MembershipRole.OWNER)
  @Post('/tenants/:tenantId/address')
  async updateAddress(@Req() req: AuthenticatedRequest, @Body() dto: UpdateTenantAddressDto) {
    const { tenantId } = req.params;
    const { userId } = req.user;
    return this.onboardingService.updateAddress(tenantId, userId, dto);
  }

  @Post('/tenants/:tenantId/availability')
  async updateAvailability(@Req() req: AuthenticatedRequest, @Body() dto: UpdateAvailabilityDto) {
    const { tenantId } = req.params;
    const { userId } = req.user;
    return this.onboardingService.updateAvailability(tenantId, userId, dto);
  }

  @Post('/tenants/:tenantId/assets')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async updateAssets(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const tenantId = req.params.tenantId;
    const { userId } = req.user;
    return this.onboardingService.updateAssets(tenantId, userId, files);
  }
}
