import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardPortalService } from '../../application/dashboard-portal.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller('portal/dashboard')
export class DashboardPortalController {
  constructor(private readonly dashboardService: DashboardPortalService) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getTenantOverview(req.tenant.id);
  }
}
