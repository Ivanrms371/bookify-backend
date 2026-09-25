import { Controller, Get, Req } from '@nestjs/common';
import { DashboardPortalService } from '../../application/dashboard-portal.service';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('portal/dashboard')
export class DashboardPortalController {
  constructor(private readonly dashboardService: DashboardPortalService) {}

  @Get('overview')
  async getOverview(@GetTenantId() tenantId: string) {
    return this.dashboardService.getTenantOverview(tenantId);
  }
}
