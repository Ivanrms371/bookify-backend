import { ProfessionalDeletionForbiddenException } from './exceptions/professional-deletion-forbidden.exception';
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
import type { Invitation } from 'src/generated/prisma/client';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { InvalidProfessionalRoleException } from './exceptions/invalid-professional-role.exception';
import { verifyAssignableServices } from '../professionals/utils/assignment-eligibility';

import { lockTenantAccess, lockProfessionalAccess } from 'src/common/database/access-lock';
import { normalizeProfessionalContact, accessStatus, canChangeAccess, resolveAccessAction } from './utils/professional-access';
import type { AccessViewer, ProfessionalAccessContext, ProfessionalAccessAction } from './types/professional-access.types';

import {
  StaleProfessionalAccessException,
  ProfessionalAccessForbiddenException,
  ProfessionalEditorForbiddenException,
  ProfessionalMembershipMissingException,
} from './exceptions/professional-access.exception';

import { EmptyMemberUpdateException, TeamMemberNotFoundException, SelfMembershipChangeException } from './exceptions/team-member.exception';
import { loadTeamManager, verifyManageableRole } from 'src/common/security/utils/team-management';
import type { TeamResponseDto } from './dto/team-response.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly invitationsService: InvitationsService,
    private readonly professionalsService: ProfessionalsService,
    private readonly prisma: PrismaService,
  ) {}

  async getTeam(tenantId: string): Promise<TeamResponseDto> {
    const members = await this.membershipsService.findAll(tenantId);
    const invitations = await this.invitationsService.listForManagement(tenantId);

    const formattedMembers = members.map((member) => TeamMapper.toTeamMemberDto(member, tenantId));

    return {
      members: formattedMembers,
      invitations,
    };
  }

  async createProfessional(tenantId: string, dto: CreateTeamProfessionalDto) {
    if (dto.role !== undefined && dto.role !== MembershipRole.STAFF) {
      throw new InvalidProfessionalRoleException();
    }
    const { giveAccess, role, ...profile } = dto;
    const contact = normalizeProfessionalContact(profile);
    const result = await this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      await verifyAssignableServices(tenantId, profile.serviceIds ?? [], tx);
      const professional = await this.professionalsService.create(tenantId, contact, tx);
      let invitation: Invitation | null = null;
      if (giveAccess) {
        invitation = await this.invitationsService.createPendingInvitation(
          tenantId,
          {
            name: contact.name,
            email: contact.email,
            role: MembershipRole.STAFF,
            professionalId: professional.id,
          },
          tx,
        );
      }
      return { professional, invitation };
    });
    // Delivery is separate from creation: failures cannot undo the committed professional.
    if (result.invitation) {
      await this.invitationsService.queueInvitationNotification(result.invitation);
    }
    return result.professional;
  }

  async updateProfessional(tenantId: string, id: string, dto: UpdateTeamProfessionalDto, viewer: AccessViewer) {
    const invitation = await this.prisma.$transaction(async (tx) => {
      await lockProfessionalAccess(tx, tenantId, id);
      const editor = await this.verifyProfessionalEditor(tenantId, viewer.id, tx);
      const access = await this.loadProfessionalAccess(tenantId, id, tx);
      const contact = normalizeProfessionalContact(dto);
      const recipientChanged = this.pendingRecipientChanged(access, contact.email);
      const action = resolveAccessAction(access.status, dto.giveAccess, recipientChanged);

      this.verifyAccessIntent(dto, access, action, editor);
      await this.professionalsService.update(tenantId, id, contact, tx);
      return this.applyProfessionalAccess(tenantId, access, action, contact, tx);
    });

    if (invitation) {
      await this.invitationsService.queueInvitationNotification(invitation);
    }
    return { success: true };
  }

  private async verifyProfessionalEditor(tenantId: string, userId: string, tx: TransactionClient): Promise<AccessViewer> {
    const membership = await this.membershipsService.findByUserId(tenantId, userId, tx);
    if (!membership?.isActive) {
      throw new ProfessionalEditorForbiddenException();
    }
    if (membership.role !== MembershipRole.OWNER && membership.role !== MembershipRole.ADMIN) {
      throw new ProfessionalEditorForbiddenException();
    }
    return { id: userId, role: membership.role };
  }

  private async loadProfessionalAccess(tenantId: string, id: string, tx: TransactionClient): Promise<ProfessionalAccessContext> {
    const professional = await this.professionalsService.findById(tenantId, id, tx);
    if (!professional) {
      throw new NotFoundException('Profesional no encontrado');
    }
    let membership: ProfessionalAccessContext['membership'] = null;
    if (professional.userId) {
      membership = await this.membershipsService.findByUserId(tenantId, professional.userId, tx);
    }
    const invitation = await tx.invitation.findFirst({
      where: { tenantId, professionalId: id, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return { professional, membership, invitation, status: accessStatus(professional.userId, membership, invitation) };
  }

  private pendingRecipientChanged(access: ProfessionalAccessContext, email?: string) {
    if (access.status !== 'PENDING' || email === undefined) {
      return false;
    }
    return email !== access.invitation?.email;
  }

  private verifyAccessIntent(
    dto: UpdateTeamProfessionalDto,
    access: ProfessionalAccessContext,
    action: ProfessionalAccessAction,
    viewer: AccessViewer,
  ) {
    const accessWasSubmitted = dto.giveAccess !== undefined;
    const accessWillChange = action !== 'KEEP';
    if (accessWasSubmitted || accessWillChange) {
      if (dto.accessStatus !== access.status) {
        throw new StaleProfessionalAccessException();
      }
    }
    if (!accessWillChange) {
      return;
    }
    const role = access.membership?.role ?? access.invitation?.role;
    if (!canChangeAccess(viewer, access.professional.userId, role)) {
      throw new ProfessionalAccessForbiddenException();
    }
  }

  private async applyProfessionalAccess(
    tenantId: string,
    access: ProfessionalAccessContext,
    action: ProfessionalAccessAction,
    contact: UpdateTeamProfessionalDto,
    tx: TransactionClient,
  ): Promise<Invitation | null> {
    const { professional, membership } = access;
    switch (action) {
      case 'KEEP':
        return null;
      case 'DISABLE_MEMBERSHIP':
      case 'RESTORE_MEMBERSHIP':
        if (!membership) {
          throw new ProfessionalMembershipMissingException();
        }
        await this.membershipsService.update(tenantId, membership.id, { isActive: action === 'RESTORE_MEMBERSHIP' }, tx);
        return null;
      case 'CANCEL_INVITATION':
        await this.invitationsService.revokeByProfessionalId(tenantId, professional.id, tx);
        return null;
      case 'INVITE':
        await this.invitationsService.revokeByProfessionalId(tenantId, professional.id, tx);
        return this.invitationsService.createPendingInvitation(
          tenantId,
          {
            name: contact.name ?? professional.name,
            email: contact.email ?? professional.email,
            role: MembershipRole.STAFF,
            professionalId: professional.id,
          },
          tx,
        );
    }
  }

  async deleteProfessional(tenantId: string, id: string, viewer: AccessViewer) {
    return this.prisma.$transaction(async (tx) => {
      await lockProfessionalAccess(tx, tenantId, id);
      const editor = await this.verifyProfessionalEditor(tenantId, viewer.id, tx);
      const { professional, membership, invitation } = await this.loadProfessionalAccess(tenantId, id, tx);
      if (!canChangeAccess(editor, professional.userId, membership?.role ?? invitation?.role)) {
        throw new ProfessionalDeletionForbiddenException();
      }

      await this.professionalsService.delete(tenantId, id, tx);
      await this.invitationsService.revokeByProfessionalId(tenantId, id, tx);
      if (membership) {
        await this.membershipsService.delete(tenantId, membership.id, tx);
      }
      return { success: true };
    });
  }

  async inviteMember(tenantId: string, dto: InviteTeamMemberDto, actorId: string) {
    return this.invitationsService.create(tenantId, dto, actorId);
  }

  async updateMember(tenantId: string, id: string, dto: UpdateTeamMemberDto, actorId: string) {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new EmptyMemberUpdateException();
    }
    return this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const actor = await loadTeamManager(tx, tenantId, actorId);
      const member = await tx.membership.findUnique({ where: { id, tenantId } });
      if (!member) throw new TeamMemberNotFoundException();
      if (member.userId === actorId) throw new SelfMembershipChangeException();
      verifyManageableRole(actor.role, member.role, dto.role);
      await this.membershipsService.update(
        tenantId,
        id,
        {
          ...(dto.role !== undefined && { role: dto.role }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        tx,
      );
      return { success: true };
    });
  }

  async removeMember(tenantId: string, id: string, actorId: string) {
    return this.updateMember(tenantId, id, { isActive: false }, actorId);
  }

  async updateInvitation(tenantId: string, id: string, dto: UpdateInvitationDto, actorId: string) {
    await this.invitationsService.updateRole(tenantId, id, dto.role, actorId);
    return { success: true };
  }

  async resendInvitation(tenantId: string, id: string, actorId: string) {
    return this.invitationsService.resend(tenantId, id, actorId);
  }

  async revokeInvitation(tenantId: string, id: string, actorId: string) {
    return this.invitationsService.revoke(tenantId, id, actorId);
  }
}
