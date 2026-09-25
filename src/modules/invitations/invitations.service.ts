import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { Invitation } from 'src/generated/prisma/client';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly professionalsService: ProfessionalsService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findValidInvitationOrThrow(token: string) {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    if (invitation.revokedAt) {
      throw new ConflictException('Esta invitación ha sido revocada.');
    }
    if (invitation.acceptedAt) {
      throw new ConflictException('Esta invitación ya ha sido aceptada.');
    }
    if (invitation.expiresAt <= new Date()) {
      throw new ConflictException('Esta invitación ha expirado.');
    }

    return invitation;
  }

  async upsertProfessionalInvitation(
    tenantId: string,
    professionalId: string,
    email: string,
    role: any,
    name: string,
    tx?: TransactionClient,
  ) {
    const formattedEmail = email.trim().toLowerCase();

    // Check if the new email belongs to an existing user/member
    const existingUser = await this.usersService.findByEmail(formattedEmail);
    if (existingUser) {
      const membership = await this.membershipsService.findByUserId(tenantId, existingUser.id);
      if (membership) {
        throw new ConflictException('El usuario ya es miembro de este espacio.');
      }
    }

    // Check if there's already an invitation for THIS EMAIL (that is not this professional's)
    const existingInvite = await this.invitationsRepository.findByEmail(tenantId, formattedEmail, tx);
    if (
      existingInvite &&
      existingInvite.professionalId !== professionalId &&
      !existingInvite.acceptedAt &&
      !existingInvite.revokedAt &&
      existingInvite.expiresAt > new Date()
    ) {
      throw new ConflictException('Ya existe una invitación pendiente para este correo electrónico.');
    }

    const pendingInvite = await this.invitationsRepository.findPendingByProfessionalId(tenantId, professionalId, tx);
    if (!pendingInvite) {
      return this.create(tenantId, { email: formattedEmail, role, professionalId, name }, tx);
    } else {
      return this.invitationsRepository.update(pendingInvite.id, { email: formattedEmail, role }, tx);
    }
  }

  async create(tenantId: string, dto: CreateInviteDto, tx?: TransactionClient) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      const membership = await this.membershipsService.findByUserId(tenantId, existingUser.id);
      if (membership) {
        throw new ConflictException('El usuario ya es miembro de este espacio.');
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

    const tenant = await this.tenantsService.findById(tenantId);

    this.eventEmitter.emit(
      'invitation.created',
      new InvitationCreatedEvent(tenantId, invitation.id, email, token, dto.role, tenant?.name ?? 'Bookify'),
    );

    return invitation;
  }

  async revoke(tenantId: string, invitationId: string) {
    const invitation = await this.invitationsRepository.findById(tenantId, invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    if (invitation.acceptedAt) {
      throw new ConflictException('No se puede revocar una invitación que ya ha sido aceptada.');
    }
    if (invitation.revokedAt) {
      throw new ConflictException('La invitación ya está revocada.');
    }

    return this.invitationsRepository.revoke(tenantId, invitationId);
  }

  async updateRole(tenantId: string, invitationId: string, role: any) {
    const invitation = await this.invitationsRepository.findById(tenantId, invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }
    if (invitation.acceptedAt || invitation.revokedAt) {
      throw new ConflictException('No se puede modificar esta invitación.');
    }
    return this.invitationsRepository.update(invitationId, { role });
  }

  async resend(tenantId: string, invitationId: string) {
    const invitation = await this.invitationsRepository.findById(tenantId, invitationId);
    if (!invitation) throw new NotFoundException('Invitación no encontrada.');
    if (invitation.acceptedAt || invitation.revokedAt) throw new ConflictException('No se puede reenviar esta invitación.');

    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), 7);

    const updated = await this.invitationsRepository.update(invitationId, { token, expiresAt });

    const tenant = await this.tenantsService.findById(tenantId);

    this.eventEmitter.emit(
      'invitation.created',
      new InvitationCreatedEvent(tenantId, invitation.id, invitation.email, token, invitation.role, tenant?.name || 'nuestra plataforma'),
    );

    return updated;
  }

  async verify(token: string) {
    const invitation = await this.findValidInvitationOrThrow(token);

    const existingUser = await this.usersService.findByEmail(invitation.email);

    const professional = invitation.professionalId
      ? await this.professionalsService.findById(invitation.tenantId, invitation.professionalId)
      : null;

    return {
      valid: true,
      email: invitation.email,
      businessName: invitation.tenant?.name,
      tenantId: invitation.tenant.id,
      role: invitation.role,
      professional: professional
        ? {
            id: professional.id,
            name: professional.name,
          }
        : null,
      hasExistingUser: !!existingUser,
    };
  }

  async accept(token: string, currentUserId: string, currentUserEmail: string) {
    const invitation = await this.findValidInvitationOrThrow(token);

    if (invitation.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
      throw new ForbiddenException('Esta invitación no corresponde a tu cuenta activa.');
    }

    return this.prisma.$transaction(async (tx) => {
      return this.acceptWithTx(tx, invitation, currentUserId);
    });
  }

  async acceptWithTx(tx: TransactionClient, invitation: Invitation, userId: string) {
    await this.invitationsRepository.accept(invitation.id, tx);

    const membership = await this.membershipsService.create(invitation.tenantId, userId, invitation.role, tx);

    if (invitation.professionalId) {
      await this.professionalsService.linkToUser(invitation.tenantId, invitation.professionalId, userId, tx);
    }

    return membership;
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
