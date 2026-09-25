import { Body, Controller, Get, Patch, Param, Post, Delete, Put } from '@nestjs/common';
import { TeamService } from './team.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CreateTeamProfessionalDto } from './dto/create-team-professional.dto';
import { UpdateTeamProfessionalDto } from './dto/update-team-professional.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { Roles } from 'src/common/security/decorators/roles.decorator';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  async getTeam(@GetTenantId() tenantId: string) {
    return this.teamService.getTeam(tenantId);
  }

  @Post('professionals')
  @Roles('OWNER', 'ADMIN')
  async createProfessional(@GetTenantId() tenantId: string, @Body() dto: CreateTeamProfessionalDto) {
    return this.teamService.createProfessional(tenantId, dto);
  }

  @Put('professionals/:id')
  @Roles('OWNER', 'ADMIN')
  async updateProfessional(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTeamProfessionalDto) {
    return this.teamService.updateProfessional(tenantId, id, dto);
  }

  @Delete('professionals/:id')
  @Roles('OWNER', 'ADMIN')
  async deleteProfessional(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.deleteProfessional(tenantId, id);
  }

  // --- MEMBERS ---

  @Post('members/invite')
  @Roles('OWNER', 'ADMIN')
  async inviteMember(@GetTenantId() tenantId: string, @Body() dto: InviteTeamMemberDto) {
    return this.teamService.inviteMember(tenantId, dto);
  }

  @Patch('members/:id')
  @Roles('OWNER', 'ADMIN')
  async updateMember(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.updateMember(tenantId, id, dto);
  }

  @Delete('members/:id')
  @Roles('OWNER', 'ADMIN')
  async removeMember(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.removeMember(tenantId, id);
  }

  // --- INVITATIONS ---

  @Patch('invitations/:id')
  @Roles('OWNER', 'ADMIN')
  async updateInvitation(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInvitationDto) {
    return this.teamService.updateInvitation(tenantId, id, dto);
  }

  @Post('invitations/:id/resend')
  @Roles('OWNER', 'ADMIN')
  async resendInvitation(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.resendInvitation(tenantId, id);
  }

  @Delete('invitations/:id')
  @Roles('OWNER', 'ADMIN')
  async revokeInvitation(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.revokeInvitation(tenantId, id);
  }
}
