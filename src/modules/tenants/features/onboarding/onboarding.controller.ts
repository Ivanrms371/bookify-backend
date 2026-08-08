import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { TenantOnboardingService } from './onboarding.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { WorkspaceStepDto } from './dto/workspace-step.dto';
import { BusinessStepDto } from './dto/business-step.dto';
import { ScheduleStepDto } from './dto/schedule-step.dto';
import { ServicesStepDto } from './dto/services-step.dto';
import { TeamStepDto } from './dto/team-step.dto';
import { CustomizeStepDto } from './dto/customize-step.dto';
import { ConfirmStepDto } from './dto/confirm-step.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class TenantOnboardingController {
  constructor(private readonly tenantOnboardingService: TenantOnboardingService) {}

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.tenantOnboardingService.getStatus(userId);
  }

  @Post('init')
  async init(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const userName = req.user.name;
    return this.tenantOnboardingService.initalize(userId, userName);
  }

  @Patch('workspace')
  async updateWorkspace(@Req() req: AuthenticatedRequest, @Body() body: WorkspaceStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateWorkspace(userId, body);
  }

  @Patch('business')
  async updateBusiness(@Req() req: AuthenticatedRequest, @Body() body: BusinessStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateBusiness(userId, body);
  }

  @Patch('schedule')
  async updateSchedule(@Req() req: AuthenticatedRequest, @Body() body: ScheduleStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateSchedule(userId, body);
  }

  @Patch('services')
  async updateServices(@Req() req: AuthenticatedRequest, @Body() body: ServicesStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateServices(userId, body);
  }

  @Patch('team')
  async updateTeam(@Req() req: AuthenticatedRequest, @Body() body: TeamStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateTeam(userId, body);
  }

  @Patch('customize')
  async updateCustomize(@Req() req: AuthenticatedRequest, @Body() body: CustomizeStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.updateCustomize(userId, body);
  }

  @Patch('confirm')
  async confirm(@Req() req: AuthenticatedRequest, @Body() body: ConfirmStepDto) {
    const userId = req.user.id;
    return this.tenantOnboardingService.confirm(userId, body);
  }
}
