import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DashboardTenantService } from './dashboard-tenant.service';
import { DashboardAccessGuard } from './dashboard-access.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@UseGuards(DashboardAccessGuard)
@Controller('tenant/:tenantId/dashboard')
export class DashboardTenantController {
  constructor(private readonly dashboardService: DashboardTenantService) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getOverview(req.tenant.membership);
  }

  @Get('analytics')
  async getAnalytics(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getOverview(req.tenant.membership);
  }

  @Get('upcoming-appointments')
  async getUpcomingAppointments(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getUpcomingAppointments(req.tenant.membership);
  }

  @Get('revenue-chart')
  async getRevenueChart(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getRevenueChart(req.tenant.membership);
  }

  @Get('quota-usage')
  async getQuotaUsage(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getQuotaUsage(req.tenant.membership);
  }
}
