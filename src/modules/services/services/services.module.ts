import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { StaffsModule } from '../../staffs/staffs.module';
import { MembersModule } from 'src/modules/businesses/features/members/members.module';
import { GuardsModule } from 'src/common/guards/guards.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';
import { MediaModule } from 'src/shared/media/media.module';

@Module({
  imports: [GuardsModule, StaffsModule, MembersModule, SubscriptionsModule, MediaModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
