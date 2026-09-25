import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { TenantOnboardingService } from './onboarding.service';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { WorkspaceStepDto } from './dto/workspace-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { OptionalTenant } from 'src/common/security/decorators/optional-tenant.decorator';
import { SkipTenant } from 'src/common/security/decorators/skip-tenant.decorator';

@Controller('onboarding')
export class TenantOnboardingController {
  constructor(private readonly tenantOnboardingService: TenantOnboardingService) {}

  @SkipTenant()
  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.tenantOnboardingService.getStatus(userId);
  }

  @SkipTenant()
  @Post('init')
  async init(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const userName = req.user.name;
    return this.tenantOnboardingService.initalize(userId, userName);
  }

  @Patch('workspace')
  async updateWorkspace(@Req() req: AuthenticatedRequest, @Body() dto: WorkspaceStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateWorkspace(userId, dto);
  }

  @Patch('business')
  async updateBusiness(@Req() req: AuthenticatedRequest, @Body() dto: BusinessStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateBusiness(userId, dto);
  }

  @Patch('schedule')
  async updateSchedule(@Req() req: AuthenticatedRequest, @Body() dto: ScheduleStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateSchedule(userId, dto);
  }

  @Patch('services')
  async updateServices(@Req() req: AuthenticatedRequest, @Body() dto: ServicesStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateServices(userId, dto);
  }

  @Patch('team')
  async updateTeam(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateTeam(userId);
  }

  @Patch('customize')
  async updateCustomize(@Req() req: AuthenticatedRequest, @Body() dto: CustomizeStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateCustomize(userId, dto);
  }

  @Patch('confirm')
  async confirm(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.tenantOnboardingService.confirm(userId);
  }
}
