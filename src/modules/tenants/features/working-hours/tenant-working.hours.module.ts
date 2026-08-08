import { Module } from '@nestjs/common';
import { TenantWorkingHoursController } from './tenant-working-hours.controller';
import { TenantWorkingHoursService } from './tenant-working-hours.service';
import { TenantWorkingHoursRepository } from './tenant-working-hours.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TenantWorkingHoursController],
  providers: [TenantWorkingHoursService, TenantWorkingHoursRepository],
  exports: [TenantWorkingHoursService],
})
export class TenantWorkingHoursModule {}
