import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { InvitationsRepository } from './invitations.repository';
import type { CreateInviteDto } from './dto/create-invite.dto';
import { InvitationStatus } from 'src/generated/prisma/enums';

@Injectable()
export class InvitationsService {
  constructor(private readonly invitationsRepository: InvitationsRepository) {}

  async invite(tenantId: string, dto: CreateInviteDto) {
    // Prevent duplicate pending invitations for the same email in this tenant
    const existing = await this.invitationsRepository.findByEmail(tenantId, dto.email);
    if (existing?.status === 'PENDING') {
      throw new BadRequestException('Ya existe una invitación pendiente para este correo');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), 7); // 7-day expiry

    const { comisionType, ...restDto } = dto;

    const invitation = await this.invitationsRepository.create({
      ...restDto,
      commissionType: dto.commissionType ?? comisionType,
      tenant: { connect: { id: tenantId } },
      token,
      expiresAt,
    });

    // TODO: send invitation email via email service
    console.log('Sending email ' + invitation.email);

    return { success: true };
  }

  async accept(token: string) {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya fue utilizada o expiró');
    }

    if (invitation.expiresAt < new Date()) {
      await this.invitationsRepository.updateStatus(token, InvitationStatus.EXPIRED);
      throw new BadRequestException('La invitación ha expirado');
    }

    await this.invitationsRepository.updateStatus(token, InvitationStatus.ACCEPTED);

    // TODO: create user account + membership + assign services

    return { message: 'Invitación aceptada correctamente' };
  }

  async update(tenantId: string, id: string, dto: CreateInviteDto) {
    const invitation = await this.invitationsRepository.findById(id);

    if (!invitation || invitation.tenantId !== tenantId) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden editar invitaciones pendientes');
    }

    const { comisionType, ...restDto } = dto;

    let token = invitation.token;
    let expiresAt = invitation.expiresAt;
    if (dto.email !== invitation.email) {
      const existing = await this.invitationsRepository.findByEmail(tenantId, dto.email);
      if (existing && existing.id !== id && existing.status === 'PENDING') {
        throw new BadRequestException('Ya existe una invitación pendiente para este correo');
      }
      token = randomBytes(32).toString('hex');
      expiresAt = addDays(new Date(), 7);
    }

    await this.invitationsRepository.update(id, {
      ...restDto,
      commissionType: dto.commissionType ?? comisionType,
      token,
      expiresAt,
    });

    return { success: true };
  }

  async cancel(tenantId: string, id: string) {
    const invitation = await this.invitationsRepository.findById(id);

    if (!invitation || invitation.tenantId !== tenantId) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden cancelar invitaciones pendientes');
    }

    await this.invitationsRepository.update(id, {
      status: 'CANCELLED',
    });

    return { success: true };
  }

  async getAll(tenantId: string) {
    return this.invitationsRepository.findMany(tenantId);
  }
}
