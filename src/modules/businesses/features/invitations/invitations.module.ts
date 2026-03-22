import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { AcceptanceController } from './acceptance/acceptance.controller';
import { CookieModule } from 'src/shared/cookies/cookie.module';
import { MembersModule } from '../members/members.module';
import { BusinessQuotaModule } from '../quota/business-quota.module';
import { BusinessesModule } from '../../businesses.module';
import { StaffsModule } from 'src/modules/staffs/staffs.module';
import { UsersModule } from 'src/modules/users/users.module';
import { GuardsModule } from 'src/common/guards/guards.module';
import { SubscriptionsModule } from 'src/modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    CookieModule,
    GuardsModule,
    UsersModule,
    BusinessesModule,
    MembersModule,
    BusinessQuotaModule,
    StaffsModule,
    SubscriptionsModule,
  ],
  controllers: [InvitationsController, AcceptanceController],
  providers: [InvitationsService, InvitationsRepository],
  exports: [InvitationsService],
})
export class InvitationsModule {}
