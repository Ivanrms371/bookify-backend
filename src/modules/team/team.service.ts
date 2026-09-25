import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsService } from '../memberships/memberships.service';
import { InvitationsService } from '../invitations/invitations.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateTeamProfessionalDto } from './dto/create-team-professional.dto';
import { UpdateTeamProfessionalDto } from './dto/update-team-professional.dto';
import { MembershipRole } from 'src/generated/prisma/enums';
import { TeamMapper } from './mappers/team.mapper';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly invitationsService: InvitationsService,
    private readonly professionalsService: ProfessionalsService,
    private readonly prisma: PrismaService,
  ) {}

  async getTeam(tenantId: string) {
    const members = await this.membershipsService.findAll(tenantId);
    const invitations = await this.invitationsService.findPending(tenantId);

    const formattedMembers = members.filter((m) => m.isActive).map(TeamMapper.toTeamMemberDto);

    const formattedInvitations = invitations.map(TeamMapper.toPendingInvitationDto);

    return {
      members: formattedMembers,
      invitations: formattedInvitations,
    };
  }

  async createProfessional(tenantId: string, dto: CreateTeamProfessionalDto) {
    return this.prisma.$transaction(async (tx) => {
      const professional = await this.professionalsService.create(tenantId, dto, tx);

      if (dto.giveAccess && dto.email) {
        await this.invitationsService.create(
          tenantId,
          {
            name: dto.name,
            email: dto.email,
            role: dto.role || MembershipRole.STAFF,
            professionalId: professional.id,
          },
          tx,
        );
      }

      return professional;
    });
  }

  async updateProfessional(tenantId: string, id: string, dto: UpdateTeamProfessionalDto) {
    return this.prisma.$transaction(async (tx) => {
      const professional = await this.professionalsService.findById(tenantId, id, tx);
      if (!professional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      await this.professionalsService.update(tenantId, id, { ...dto, giveAccess: dto.giveAccess ?? false }, tx);

      if (dto.giveAccess === true && dto.email) {
        if (professional.userId === null) {
          await this.invitationsService.upsertProfessionalInvitation(
            tenantId,
            id,
            dto.email,
            dto.role || MembershipRole.STAFF,
            dto.name || professional.name,
            tx,
          );
        }
      } else if (dto.giveAccess === false) {
        if (professional.userId === null) {
          await this.invitationsService.revokeByProfessionalId(tenantId, id, tx);
        }
      }

      if (professional.userId !== null && dto.role) {
        await this.membershipsService.updateRole(tenantId, professional.userId, dto.role, tx);
      }

      return { success: true };
    });
  }

  async deleteProfessional(tenantId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const professional = await this.professionalsService.findById(tenantId, id, tx);
      if (!professional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      await this.professionalsService.delete(tenantId, id, tx);
      await this.invitationsService.revokeByProfessionalId(tenantId, id, tx);

      if (professional.userId) {
        await this.membershipsService.deactivateByUserId(tenantId, professional.userId, tx);
      }

      return { success: true };
    });
  }

  // --- STANDARD MEMBERS (NON-PROFESSIONALS) ---

  async inviteMember(tenantId: string, dto: InviteTeamMemberDto) {
    return this.invitationsService.create(tenantId, {
      name: dto.name,
      email: dto.email,
      role: dto.role,
    });
  }

  async updateMember(tenantId: string, id: string, dto: UpdateTeamMemberDto) {
    if (dto.role) {
      await this.membershipsService.updateRoleByMembershipId(tenantId, id, dto.role);
    }
    return { success: true };
  }

  async removeMember(tenantId: string, id: string) {
    await this.membershipsService.deactivateByMembershipId(tenantId, id);
    return { success: true };
  }

  // --- INVITATIONS MANAGEMENT ---

  async updateInvitation(tenantId: string, id: string, dto: UpdateInvitationDto) {
    if (dto.role) {
      await this.invitationsService.updateRole(tenantId, id, dto.role);
    }
    return { success: true };
  }

  async resendInvitation(tenantId: string, id: string) {
    return this.invitationsService.resend(tenantId, id);
  }

  async revokeInvitation(tenantId: string, id: string) {
    return this.invitationsService.revoke(tenantId, id);
  }
}
