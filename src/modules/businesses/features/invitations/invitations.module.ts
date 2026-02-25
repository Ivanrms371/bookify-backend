import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AcceptanceController } from './acceptance/acceptance.controller';
import { CookieModule } from 'src/shared/cookies/cookie.module';
import { MembersModule } from '../members/members.module';
import { BusinessLimitsModule } from '../limits/business-limits.module';
import { BusinessesModule } from '../../businesses.module';
import { StaffsModule } from 'src/modules/staffs/staffs.module';

@Module({
  imports: [CookieModule, AuthModule, UsersModule, BusinessesModule, MembersModule, BusinessLimitsModule, StaffsModule],
  controllers: [InvitationsController, AcceptanceController],
  providers: [InvitationsService, InvitationsRepository],
  exports: [InvitationsService],
})
export class InvitationsModule {}
