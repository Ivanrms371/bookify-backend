import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
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

  @Permissions(PERMISSIONS.TEAM_READ)
  @Get()
  async getTeam(@GetTenantId() tenantId: string) {
    return this.teamService.getTeam(tenantId);
  }

  @Permissions(PERMISSIONS.TEAM_INVITE)
  @Post('professionals')
  async createProfessional(@GetTenantId() tenantId: string, @Body() dto: CreateTeamProfessionalDto) {
    return this.teamService.createProfessional(tenantId, dto);
  }

  @Permissions(PERMISSIONS.TEAM_UPDATE)
  @Put('professionals/:id')
  async updateProfessional(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTeamProfessionalDto) {
    return this.teamService.updateProfessional(tenantId, id, dto);
  }

  @Permissions(PERMISSIONS.TEAM_DELETE)
  @Delete('professionals/:id')
  async deleteProfessional(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.deleteProfessional(tenantId, id);
  }

  // --- MEMBERS ---

  @Permissions(PERMISSIONS.TEAM_INVITE)
  @Post('members/invite')
  async inviteMember(@GetTenantId() tenantId: string, @Body() dto: InviteTeamMemberDto) {
    return this.teamService.inviteMember(tenantId, dto);
  }

  @Permissions(PERMISSIONS.TEAM_UPDATE)
  @Patch('members/:id')
  async updateMember(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.updateMember(tenantId, id, dto);
  }

  @Permissions(PERMISSIONS.TEAM_DELETE)
  @Delete('members/:id')
  async removeMember(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.removeMember(tenantId, id);
  }

  // --- INVITATIONS ---

  @Permissions(PERMISSIONS.TEAM_UPDATE)
  @Patch('invitations/:id')
  async updateInvitation(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInvitationDto) {
    return this.teamService.updateInvitation(tenantId, id, dto);
  }

  @Permissions(PERMISSIONS.TEAM_INVITE)
  @Post('invitations/:id/resend')
  async resendInvitation(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.resendInvitation(tenantId, id);
  }

  @Permissions(PERMISSIONS.TEAM_DELETE)
  @Delete('invitations/:id')
  async revokeInvitation(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.teamService.revokeInvitation(tenantId, id);
  }
}
