import { Injectable } from '@nestjs/common';
import { ReportMetricsService } from './report-metrics.service';
import { ReportMetricsRepository } from '../repositories/report-metrics.repository';
import { ReportFilterNotFoundException, ReportSettingsNotFoundException } from '../exceptions/report.exceptions';
import { resolveReportScope } from '../utils/report-period';
import type { ReportQuery, ReportOverviewResponse, ReportFilterOptionsResponse } from '../types/reports.types';
import { mapReportOverview, mapReportFilterOptions } from '../mappers/reports.mapper';

@Injectable()
export class ReportsService {
  constructor(private readonly metrics: ReportMetricsService, private readonly repository: ReportMetricsRepository) {}

  async getOverview(tenantId: string, query: ReportQuery): Promise<ReportOverviewResponse> {
    const settings = await this.repository.findSettings(tenantId);
    if (!settings) throw new ReportSettingsNotFoundException();
    const scope = resolveReportScope(tenantId, query, settings.timeZone, settings.currency, new Date());
    if (!(await this.repository.filtersBelongToTenant(scope))) throw new ReportFilterNotFoundException();
    const data = await this.metrics.getReportsMetrics(scope);
    return mapReportOverview(data, scope.period);
  }

  async getFilterOptions(tenantId: string): Promise<ReportFilterOptionsResponse> {
    const [options, settings] = await Promise.all([this.repository.findFilterOptions(tenantId), this.repository.findSettings(tenantId)]);
    if (!settings) throw new ReportSettingsNotFoundException();
    return mapReportFilterOptions(options, settings);
  }
}
