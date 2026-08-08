import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@GetTenantId() tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }
}
