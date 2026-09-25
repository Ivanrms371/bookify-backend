import { Controller, Get } from '@nestjs/common';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@GetTenantId() tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }
}
