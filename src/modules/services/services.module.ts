import { TenantUsageModule } from '../tenants/features/usage/tenant-usage.module';
import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { MediaModule } from 'src/shared/media/media.module';

@Module({
  imports: [TenantUsageModule, MediaModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
