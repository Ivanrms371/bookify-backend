import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Controller, Get } from '@nestjs/common';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Permissions(PERMISSIONS.REPORT_READ)
  @Get('overview')
  getOverview(@GetTenantId() tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }
}
