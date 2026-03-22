import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DashboardBusinessService } from './dashboard-business.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from './dashboard-access.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@UseGuards(JwtAuthGuard, DashboardAccessGuard)
@Controller('business/:businessId/dashboard')
export class DashboardBusinessController {
  constructor(private readonly dashboardService: DashboardBusinessService) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getOverview(req.member);
  }

  @Get('analytics')
  async getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getOverview(req.member);
  }

  @Get('upcoming-appointments')
  async getUpcomingAppointments(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getUpcomingAppointments(req.member);
  }

  @Get('revenue-chart')
  async getRevenueChart(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getRevenueChart(req.member);
  }

  @Get('quota-usage')
  async getQuotaUsage(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getQuotaUsage(req.member);
  }
}
