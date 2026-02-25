import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { BusinessLimitsModule } from '../limits/business-limits.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SettingsModule } from '../settings/settings.module';
import { BusinessStatsModule } from '../stats/business-stats.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { MembersModule } from '../members/members.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MembersModule,
    SubscriptionsModule,
    SettingsModule,
    BusinessStatsModule,
    BusinessLimitsModule,
    PlansModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingRepository],
  exports: [OnboardingService],
})
export class OnboardingModule {}
