import { Module } from '@nestjs/common';
import { TenantOnboardingRepository } from './onboarding.repository';
import { TenantOnboardingService } from './onboarding.service';
import { TenantOnboardingController } from './onboarding.controller';
import { TenantWorkingHoursModule } from '../working-hours/tenant-working.hours.module';

@Module({
  imports: [TenantWorkingHoursModule],
  controllers: [TenantOnboardingController],
  providers: [TenantOnboardingRepository, TenantOnboardingService],
  exports: [TenantOnboardingService],
})
export class TenantOnboardingModule {}
