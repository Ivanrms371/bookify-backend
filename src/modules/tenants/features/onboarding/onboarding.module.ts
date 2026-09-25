import { Module } from '@nestjs/common';
import { TenantOnboardingRepository } from './onboarding.repository';
import { TenantOnboardingService } from './onboarding.service';
import { TenantOnboardingController } from './onboarding.controller';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [TenantOnboardingController],
  providers: [TenantOnboardingRepository, TenantOnboardingService],
  exports: [TenantOnboardingService],
})
export class TenantOnboardingModule {}
