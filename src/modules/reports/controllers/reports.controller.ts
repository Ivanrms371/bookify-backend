import { Controller, Get, Query } from '@nestjs/common';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { ReportsService } from '../services/reports.service';
import { GetReportsOverviewDto } from '../dto/get-reports-overview.dto';
import type { ReportOverviewResponse, ReportFilterOptionsResponse } from '../types/reports.types';

@Controller('reports')
@Permissions(PERMISSIONS.REPORT_READ)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  getOverview(@GetTenantId() tenantId: string, @Query() query: GetReportsOverviewDto): Promise<ReportOverviewResponse> {
    return this.reports.getOverview(tenantId, query);
  }

  @Get('filter-options')
  getFilterOptions(@GetTenantId() tenantId: string): Promise<ReportFilterOptionsResponse> {
    return this.reports.getFilterOptions(tenantId);
  }
}
