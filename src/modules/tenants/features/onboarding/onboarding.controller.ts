import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { TenantOnboardingService } from './onboarding.service';
import { AuthenticatedRequest, AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';
import { WorkspaceStepDto } from './dto/workspace-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { OptionalTenant } from 'src/common/security/decorators/optional-tenant.decorator';
import { SkipTenant } from 'src/common/security/decorators/skip-tenant.decorator';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';

@Controller('onboarding')
export class TenantOnboardingController {
  constructor(private readonly tenantOnboardingService: TenantOnboardingService) {}

  @SkipTenant()
  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.tenantOnboardingService.getStatus(userId);
  }

  @SkipTenant()
  @Post('init')
  async init(@CurrentUser('id') userId: string) {
    return this.tenantOnboardingService.initalize(userId);
  }

  @Patch('workspace')
  async updateWorkspace(@CurrentUser('id') userId: string, @Body() dto: WorkspaceStepDto) {
    return this.tenantOnboardingService.updateWorkspace(userId, dto);
  }

  @Patch('business')
  async updateBusiness(@CurrentUser('id') userId: string, @Body() dto: BusinessStepDto) {
    return this.tenantOnboardingService.updateBusiness(userId, dto);
  }

  @Patch('schedule')
  async updateSchedule(@CurrentUser('id') userId: string, @Body() dto: ScheduleStepDto) {
    return this.tenantOnboardingService.updateSchedule(userId, dto);
  }

  @Patch('services')
  async updateServices(@CurrentUser('id') userId: string, @Body() dto: ServicesStepDto) {
    return this.tenantOnboardingService.updateServices(userId, dto);
  }

  @Patch('team')
  async updateTeam(@CurrentUser('id') userId: string) {
    return this.tenantOnboardingService.updateTeam(userId);
  }

  @Patch('customize')
  async updateCustomize(@CurrentUser('id') userId: string, @Body() dto: CustomizeStepDto) {
    return this.tenantOnboardingService.updateCustomize(userId, dto);
  }

  @Patch('confirm')
  async confirm(@CurrentUser('id') userId: string) {
    return this.tenantOnboardingService.confirm(userId);
  }
}
