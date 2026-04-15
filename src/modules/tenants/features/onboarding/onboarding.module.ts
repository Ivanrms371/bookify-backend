import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { MediaModule } from 'src/shared/media/media.module';
import { TenantQuotaModule } from '../quota/tenant-quota.module';
import { StatsModule } from 'src/common/stats/stats.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { OnboardingController } from './onboarding.controller';
import { StaffsModule } from 'src/modules/tenants/features/staffs/staffs.module';

@Module({
  imports: [
    MediaModule,
    MembershipsModule,
    SubscriptionsModule,
    SettingsModule,
    StatsModule,
    TenantQuotaModule,
    PlansModule,
    StaffsModule,
  ],

  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingRepository],
  exports: [OnboardingService],
})
export class OnboardingModule {}
