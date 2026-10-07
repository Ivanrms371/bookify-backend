import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';

import { InvitationsRepository } from './invitations.repository';
import type { CreateInviteDto } from './dto/create-invite.dto';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvitationCreatedEvent } from 'src/modules/tenants/events/invitation-created.event';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { Invitation } from 'src/generated/prisma/client';
import type { MembershipRole } from 'src/generated/prisma/enums';
import { TenantsService } from '../tenants/tenants.service';

import { lockTenantAccess, lockInvitationAcceptance } from 'src/common/database/access-lock';

import {
  InvitationUnavailableException,
  InvitationRecipientException,
  InvitationMembershipConflictException,
  InvitationProfessionalConflictException,
  InvitationDuplicateException,
} from './exceptions/invitation-access.exception';

import type {
  InvitationWithTenant,
  InvitationStatus,
  AcceptedInvitationResponse,
  AcceptedInvitationAccess,
} from './types/invitation-acceptance.types';

import { loadTeamManager, verifyManageableRole } from 'src/common/security/utils/team-management';
import { toInvitationManagementDto } from './mappers/invitation-management.mapper';
import type { InvitationManagementDto } from './dto/invitation-management.dto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly professionalsService: ProfessionalsService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findValidInvitationOrThrow(token: string, allowAccepted = false) {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    if (invitation.revokedAt) {
      throw new InvitationUnavailableException('revoked');
    }
    if (invitation.acceptedAt && !allowAccepted) {
      throw new InvitationUnavailableException('accepted');
    }
    if (!invitation.acceptedAt && invitation.expiresAt <= new Date()) {
      throw new InvitationUnavailableException('expired');
    }

    return invitation;
  }

  async create(tenantId: string, dto: CreateInviteDto, actorId: string) {
    const invitation = await this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const actor = await loadTeamManager(tx, tenantId, actorId);
      verifyManageableRole(actor.role, dto.role, dto.role);
      return this.createPendingInvitation(tenantId, dto, tx);
    });
    await this.queueInvitationNotification(invitation);
    return toInvitationManagementDto(invitation);
  }

  // Persistence only. The caller queues the notification after its transaction commits.
  async createPendingInvitation(tenantId: string, dto: CreateInviteDto, tx: TransactionClient): Promise<Invitation> {
    const email = dto.email.trim().toLowerCase();

    await this.verifyRecipientEligibility(tenantId, email, dto.professionalId, tx);

    const pendingInvitation = await this.invitationsRepository.findByEmail(tenantId, email, tx);
    if (pendingInvitation) {
      throw new InvitationDuplicateException();
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), 7);

    const invitation = await this.invitationsRepository.create(
      {
        email,
        role: dto.role,
        token,
        expiresAt,
        tenant: { connect: { id: tenantId } },
        ...(dto.professionalId && { professional: { connect: { id: dto.professionalId } } }),
      },
      tx,
    );

    return invitation;
  }

  private async verifyRecipientEligibility(
    tenantId: string,
    email: string,
    professionalId: string | null | undefined,
    tx: TransactionClient,
  ) {
    const user = await this.usersService.findByEmail(email, tx);
    if (user) {
      const membership = await this.membershipsService.findByUserId(tenantId, user.id, tx);
      if (membership) throw new InvitationMembershipConflictException(!membership.isActive);
    }
    if (!professionalId) return;
    const professional = await this.professionalsService.findById(tenantId, professionalId, tx);
    if (!professional || professional.tenantId !== tenantId) {
      throw new InvitationProfessionalConflictException();
    }
    if (professional.userId || professional.deletedAt) {
      throw new InvitationProfessionalConflictException();
    }
    if (!user) return;
    const linkedProfessional = await tx.professional.findFirst({ where: { userId: user.id } });
    if (linkedProfessional) {
      throw new InvitationProfessionalConflictException();
    }
  }

  async queueInvitationNotification(invitation: Invitation) {
    try {
      const tenant = await this.tenantsService.findById(invitation.tenantId);
      await this.eventEmitter.emitAsync(
        'invitation.created',
        new InvitationCreatedEvent(
          invitation.tenantId,
          invitation.id,
          invitation.email,
          invitation.token,
          invitation.role,
          tenant?.name ?? 'Bookify',
        ),
      );
    } catch {
      this.logger.error(`Could not register notification for invitation ${invitation.id}`);
    }
  }

  async revoke(tenantId: string, invitationId: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const { invitation } = await this.loadManageableInvitation(tenantId, invitationId, actorId, tx);
      if (invitation.acceptedAt) {
        throw new ConflictException('No se puede revocar una invitación que ya ha sido aceptada.');
      }
      if (invitation.revokedAt) {
        throw new ConflictException('La invitación ya está revocada.');
      }
      await this.invitationsRepository.revoke(tenantId, invitationId, tx);
      return { success: true };
    });
  }

  async updateRole(tenantId: string, invitationId: string, role: MembershipRole, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const { actor, invitation } = await this.loadManageableInvitation(tenantId, invitationId, actorId, tx);
      if (invitation.acceptedAt || invitation.revokedAt) {
        throw new InvitationUnavailableException('changed');
      }
      verifyManageableRole(actor.role, invitation.role, role);
      return toInvitationManagementDto(await this.invitationsRepository.update(tenantId, invitationId, { role }, tx));
    });
  }

  async resend(tenantId: string, invitationId: string, actorId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const { invitation } = await this.loadManageableInvitation(tenantId, invitationId, actorId, tx);
      if (invitation.acceptedAt || invitation.revokedAt) {
        throw new InvitationUnavailableException('changed');
      }
      await this.verifyRecipientEligibility(tenantId, invitation.email, invitation.professionalId, tx);
      return this.invitationsRepository.update(
        tenantId,
        invitationId,
        { token: randomBytes(32).toString('hex'), expiresAt: addDays(new Date(), 7) },
        tx,
      );
    });
    await this.queueInvitationNotification(updated);
    return toInvitationManagementDto(updated);
  }

  async verify(token: string) {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    const status = this.getInvitationStatus(invitation);
    const professional = invitation.professionalId
      ? await this.professionalsService.findById(invitation.tenantId, invitation.professionalId)
      : null;
    return {
      valid: status === 'VALID',
      status,
      email: invitation.email,
      businessName: invitation.tenant.name,
      tenantId: invitation.tenantId,
      tenantSlug: invitation.tenant.slug,
      professional: professional ? { id: professional.id, name: professional.name } : null,
      hasExistingUser: !!(await this.usersService.findByEmail(invitation.email)),
    };
  }

  async accept(token: string, currentUserId: string, currentUserEmail: string) {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    return this.prisma.$transaction((tx) => this.acceptWithTx(tx, invitation, currentUserId, currentUserEmail));
  }

  async acceptWithTx(tx: TransactionClient, original: Invitation, userId: string, email: string): Promise<AcceptedInvitationResponse> {
    await lockInvitationAcceptance(tx, original, userId);
    const invitation = await this.loadInvitationForAcceptance(original.token, tx);
    await this.verifyInvitationRecipient(invitation, userId, email, tx);
    const access = await this.loadAcceptedAccess(invitation, userId, tx);

    if (invitation.acceptedAt) {
      this.verifyAcceptedAccessIsStillActive(invitation, access, userId);
      return this.acceptedResponse(invitation);
    }

    await this.verifyNewAcceptance(invitation, access, userId, tx);
    const consumed = await this.invitationsRepository.consume(invitation.id, invitation.token, tx);
    if (!consumed) {
      throw new InvitationUnavailableException('changed');
    }
    await this.membershipsService.create(invitation.tenantId, userId, invitation.role, tx);
    if (invitation.professionalId) {
      await this.professionalsService.linkToUser(invitation.tenantId, invitation.professionalId, userId, tx);
    }
    return this.acceptedResponse(invitation);
  }

  // Call after acquiring the tenant lock so authorization uses current access.
  private async loadManageableInvitation(tenantId: string, invitationId: string, actorId: string, tx: TransactionClient) {
    const actor = await loadTeamManager(tx, tenantId, actorId);
    const invitation = await this.invitationsRepository.findById(tenantId, invitationId, tx);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    verifyManageableRole(actor.role, invitation.role);
    return { actor, invitation };
  }

  private getInvitationStatus(invitation: Invitation): InvitationStatus {
    if (invitation.revokedAt) {
      return 'REVOKED';
    }
    if (invitation.acceptedAt) {
      return 'ACCEPTED';
    }
    if (invitation.expiresAt <= new Date()) {
      return 'EXPIRED';
    }
    return 'VALID';
  }

  private async loadInvitationForAcceptance(token: string, tx: TransactionClient) {
    // Re-read after locking: the earlier lookup may precede a cancellation or replacement.
    const invitation = await this.invitationsRepository.findByToken(token, tx);
    if (!invitation || invitation.revokedAt) {
      throw new InvitationUnavailableException('revoked');
    }
    return invitation;
  }

  private async verifyInvitationRecipient(invitation: Invitation, userId: string, authenticatedEmail: string, tx: TransactionClient) {
    const user = await this.usersService.findById(userId);
    if (user.email !== invitation.email) {
      throw new InvitationRecipientException();
    }
    if (authenticatedEmail !== invitation.email) {
      throw new InvitationRecipientException();
    }
  }

  private async loadAcceptedAccess(invitation: Invitation, userId: string, tx: TransactionClient): Promise<AcceptedInvitationAccess> {
    const membership = await this.membershipsService.findByUserId(invitation.tenantId, userId, tx);
    let professional: AcceptedInvitationAccess['professional'] = null;
    if (invitation.professionalId) {
      professional = await this.professionalsService.findById(invitation.tenantId, invitation.professionalId, tx);
    }
    return { membership, professional };
  }

  private verifyAcceptedAccessIsStillActive(invitation: Invitation, access: AcceptedInvitationAccess, userId: string) {
    if (!access.membership?.isActive) {
      throw new InvitationUnavailableException('disabled');
    }
    if (invitation.professionalId && access.professional?.userId !== userId) {
      throw new InvitationUnavailableException('disabled');
    }
  }

  private async verifyNewAcceptance(invitation: Invitation, access: AcceptedInvitationAccess, userId: string, tx: TransactionClient) {
    if (invitation.expiresAt <= new Date()) {
      throw new InvitationUnavailableException('expired');
    }
    if (access.membership) {
      throw new InvitationMembershipConflictException();
    }
    if (!invitation.professionalId) {
      return;
    }
    if (!access.professional || access.professional.userId) {
      throw new InvitationProfessionalConflictException();
    }
    const alreadyLinked = await tx.professional.findFirst({ where: { userId } });
    if (alreadyLinked) {
      throw new InvitationProfessionalConflictException();
    }
  }

  private acceptedResponse(invitation: InvitationWithTenant): AcceptedInvitationResponse {
    return { success: true, tenantId: invitation.tenantId, tenantSlug: invitation.tenant.slug };
  }

  async revokeByProfessionalId(tenantId: string, professionalId: string, tx?: TransactionClient) {
    return this.invitationsRepository.revokeByProfessionalId(tenantId, professionalId, tx);
  }

  async listForManagement(tenantId: string): Promise<InvitationManagementDto[]> {
    const invitations = await this.invitationsRepository.findPending(tenantId);
    return invitations.map(toInvitationManagementDto);
  }

  async findPending(tenantId: string) {
    return this.invitationsRepository.findPending(tenantId);
  }
}
