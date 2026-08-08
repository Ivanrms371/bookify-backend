import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardPortalService } from '../../application/dashboard-portal.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('portal/dashboard')
export class DashboardPortalController {
  constructor(private readonly dashboardService: DashboardPortalService) {}

  @Get('overview')
  async getOverview(@GetTenantId() tenantId: string) {
    return this.dashboardService.getTenantOverview(tenantId);
  }
}
