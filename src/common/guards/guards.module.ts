import { Module } from '@nestjs/common';
import { BusinessGuard } from './business.guard';
import { PlatformAdminGuard } from './platform-admin.guard';

@Module({
  providers: [BusinessGuard, PlatformAdminGuard],
  exports: [BusinessGuard, PlatformAdminGuard],
})
export class GuardsModule {}
