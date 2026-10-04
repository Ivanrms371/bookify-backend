import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { TenantOnboardingService } from './onboarding.service';
import { ProfessionalStepDto } from './dto/professional-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
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

  @Patch('professional')
  async updateProfessional(@CurrentUser('id') userId: string, @Body() dto: ProfessionalStepDto) {
    return this.tenantOnboardingService.updateProfessional(userId, dto);
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
