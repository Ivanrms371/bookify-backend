import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { ReportsController } from './controllers/reports.controller';
import { DashboardService } from './services/dashboard.service';
import { ReportsService } from './services/reports.service';
import { ReportMetricsService } from './services/report-metrics.service';
import { DashboardRepository } from './repositories/dashboard.repository';
import { ReportMetricsRepository } from './repositories/report-metrics.repository';

@Module({
  controllers: [DashboardController, ReportsController],
  providers: [DashboardService, ReportsService, ReportMetricsService, DashboardRepository, ReportMetricsRepository],
})
export class ReportsModule {}
