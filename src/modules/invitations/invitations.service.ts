import { Injectable, Logger, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
} from './exceptions/invitation-access.exception';

import type {
  InvitationWithTenant,
  InvitationStatus,
  AcceptedInvitationResponse,
  AcceptedInvitationAccess,
} from './types/invitation-acceptance.types';

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

  async create(tenantId: string, dto: CreateInviteDto): Promise<Invitation> {
    const invitation = await this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      return this.createPendingInvitation(tenantId, dto, tx);
    });
    await this.queueInvitationNotification(invitation);
    return invitation;
  }

  // Persistence only. The caller queues the notification after its transaction commits.
  async createPendingInvitation(tenantId: string, dto: CreateInviteDto, tx: TransactionClient): Promise<Invitation> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email, tx);
    if (existingUser) {
      const membership = await this.membershipsService.findByUserId(tenantId, existingUser.id, tx);
      if (membership) {
        throw new InvitationMembershipConflictException();
      }
    }

    const pendingInvitation = await this.invitationsRepository.findByEmail(tenantId, email, tx);
    if (pendingInvitation && !pendingInvitation.acceptedAt && !pendingInvitation.revokedAt && pendingInvitation.expiresAt > new Date()) {
      throw new ConflictException('Ya existe una invitación pendiente para este correo electrónico.');
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

  // Called after commit. The listener registers a queued delivery; this does not send mail.
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

  async revoke(tenantId: string, invitationId: string) {
    return this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const invitation = await this.invitationsRepository.findById(tenantId, invitationId, tx);
      if (!invitation) {
        throw new NotFoundException('Invitación no encontrada.');
      }
      if (invitation.acceptedAt) {
        throw new ConflictException('No se puede revocar una invitación que ya ha sido aceptada.');
      }
      if (invitation.revokedAt) {
        throw new ConflictException('La invitación ya está revocada.');
      }
      return this.invitationsRepository.revoke(tenantId, invitationId, tx);
    });
  }

  async updateRole(tenantId: string, invitationId: string, role: MembershipRole) {
    return this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const invitation = await this.invitationsRepository.findById(tenantId, invitationId, tx);
      if (!invitation) {
        throw new NotFoundException('Invitación no encontrada.');
      }
      if (invitation.acceptedAt || invitation.revokedAt) {
        throw new InvitationUnavailableException('changed');
      }
      return this.invitationsRepository.update(invitationId, { role }, tx);
    });
  }

  async resend(tenantId: string, invitationId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await lockTenantAccess(tx, tenantId);
      const invitation = await this.invitationsRepository.findById(tenantId, invitationId, tx);
      if (!invitation) {
        throw new NotFoundException('Invitación no encontrada.');
      }
      if (invitation.acceptedAt || invitation.revokedAt) {
        throw new InvitationUnavailableException('changed');
      }
      return this.invitationsRepository.update(
        invitationId,
        { token: randomBytes(32).toString('hex'), expiresAt: addDays(new Date(), 7) },
        tx,
      );
    });
    await this.queueInvitationNotification(updated);
    return updated;
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

  async acceptWithTx(tx: TransactionClient, original: Invitation, userId: string, email?: string): Promise<AcceptedInvitationResponse> {
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

  private async verifyInvitationRecipient(
    invitation: Invitation,
    userId: string,
    authenticatedEmail: string | undefined,
    tx: TransactionClient,
  ) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new InvitationRecipientException();
    }
    const recipient = invitation.email.trim().toLowerCase();
    if (user.email.trim().toLowerCase() !== recipient) {
      throw new InvitationRecipientException();
    }
    if (authenticatedEmail !== undefined && authenticatedEmail.trim().toLowerCase() !== recipient) {
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

  async findPendingByProfessionalId(tenantId: string, professionalId: string, tx?: TransactionClient) {
    return this.invitationsRepository.findPendingByProfessionalId(tenantId, professionalId, tx);
  }

  async findPending(tenantId: string) {
    return this.invitationsRepository.findPending(tenantId);
  }
}
