import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { MembershipsModule } from '../memberships/memberships.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { ProfessionalsModule } from '../professionals/professionals.module';

@Module({
  imports: [MembershipsModule, InvitationsModule, ProfessionalsModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
