import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessAnalyticsController } from './business/business-analytics.controller';
import { BusinessAnalyticsService } from './business/business-analytics.service';
import { BusinessDailyStatsRepository } from './business/repositories/business-daily-stats.repository';
import { BusinessDailyUsageRepository } from './business/repositories/business-daily-usage.repository';
import { BusinessLifetimeStatsRepository } from './business/repositories/business-lifetime-stats.repository';
import { BusinessUsageRepository } from './business/repositories/business-usage.repository';
import { StaffAnalyticsService } from './staff/staff-analytics.service';
import { StaffDailyStatsRepository } from './staff/repositories/staff-daily-stats.repository';
import { StaffLifetimeRepository } from './staff/repositories/staff-lifetime.repository';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessAnalyticsController],
  providers: [
    BusinessAnalyticsService,
    BusinessDailyStatsRepository,
    BusinessDailyUsageRepository,
    BusinessLifetimeStatsRepository,
    BusinessUsageRepository,

    StaffAnalyticsService,
    StaffDailyStatsRepository,
    StaffLifetimeRepository,
  ],
  exports: [BusinessAnalyticsService, StaffAnalyticsService],
})
export class AnalyticsModule {}
