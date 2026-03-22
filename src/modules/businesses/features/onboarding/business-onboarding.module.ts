import { Module } from '@nestjs/common';
import { BusinessOnboardingController } from './controllers/business-onboarding.controller';
import { BusinessOnboardingService } from './business-onboarding.service';
import { BusinessOnboardingRepository } from './business-onboarding.repository';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SettingsModule } from '../settings/settings.module';
import { BusinessStatsModule } from '../stats/business-stats.module';
import { MembersModule } from '../members/members.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { BusinessOnboardingInitController } from './controllers/business-onboarding-init.controller';
import { MediaModule } from 'src/shared/media/media.module';
import { BusinessQuotaModule } from '../quota/business-quota.module';

@Module({
  imports: [MediaModule, MembersModule, SubscriptionsModule, SettingsModule, BusinessStatsModule, BusinessQuotaModule, PlansModule],
  controllers: [BusinessOnboardingInitController, BusinessOnboardingController],
  providers: [BusinessOnboardingService, BusinessOnboardingRepository],
  exports: [BusinessOnboardingService],
})
export class BusinessOnboardingModule {}
