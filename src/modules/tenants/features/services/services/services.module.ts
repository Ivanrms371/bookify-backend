import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { StaffsModule } from '../../staffs/staffs.module';
import { GuardsModule } from 'src/common/guards/guards.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { MediaModule } from 'src/shared/media/media.module';
import { MembershipsModule } from 'src/modules/tenants/features/memberships/memberships.module';

@Module({
  imports: [GuardsModule, StaffsModule, MembershipsModule, SubscriptionsModule, MediaModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
