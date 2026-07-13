import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { TenantOnboardingService } from './onboarding.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { WorkspaceStepDto } from './dto/workspace-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { TeamStepDto } from './dto/team-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { ConfirmStepDto } from './dto/confirm-step.dto';

@Controller('onboarding')
export class TenantOnboardingController {
  constructor(private readonly tenantOnboardingService: TenantOnboardingService) {}

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    return this.tenantOnboardingService.getOnboardingStatus(req.user.userId);
  }

  @Post('init')
  async init(@Req() req: AuthenticatedRequest) {
    return this.tenantOnboardingService.initializeOnboarding(req.user.userId);
  }

  @Patch('workspace')
  async updateWorkspace(@Req() req: AuthenticatedRequest, @Body() body: WorkspaceStepDto) {
    return this.tenantOnboardingService.updateWorkspace(req.user.userId, body);
  }

  @Patch('business')
  async updateBusiness(@Req() req: AuthenticatedRequest, @Body() body: BusinessStepDto) {
    return this.tenantOnboardingService.updateBusiness(req.user.userId, body);
  }

  @Patch('schedule')
  async updateSchedule(@Req() req: AuthenticatedRequest, @Body() body: ScheduleStepDto) {
    return this.tenantOnboardingService.updateSchedule(req.user.userId, body);
  }

  @Patch('services')
  async updateServices(@Req() req: AuthenticatedRequest, @Body() body: ServicesStepDto) {
    return this.tenantOnboardingService.updateServices(req.user.userId, body);
  }

  @Patch('team')
  async updateTeam(@Req() req: AuthenticatedRequest, @Body() body: TeamStepDto) {
    return this.tenantOnboardingService.updateTeam(req.user.userId, body);
  }

  @Patch('customize')
  async updateCustomize(@Req() req: AuthenticatedRequest, @Body() body: CustomizeStepDto) {
    return this.tenantOnboardingService.updateCustomize(req.user.userId, body);
  }

  @Patch('confirm')
  async confirm(@Req() req: AuthenticatedRequest, @Body() body: ConfirmStepDto) {
    return this.tenantOnboardingService.confirm(req.user.userId, body);
  }
}
