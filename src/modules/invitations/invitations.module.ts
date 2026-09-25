import { EventEmitterModule } from '@nestjs/event-emitter';

import { forwardRef, Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [EventEmitterModule, UsersModule, MembershipsModule, ProfessionalsModule, TenantsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository],
  exports: [InvitationsService],
})
export class InvitationsModule {}
