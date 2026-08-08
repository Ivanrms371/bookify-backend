import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { InvitationsRepository } from './invitations.repository';
import type { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly invitationsRepository: InvitationsRepository) {}

  async invite(tenantId: string, dto: CreateInviteDto) {
    // Prevent duplicate pending invitations for the same email in this tenant
    const existing = await this.invitationsRepository.findByTenantAndEmail(tenantId, dto.email);
    if (existing?.status === 'PENDING') {
      throw new BadRequestException('Ya existe una invitación pendiente para este correo');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), 7); // 7-day expiry

    const { name, email, phone, role, serviceIds = [] } = dto;

    const invitation = await this.invitationsRepository.create({
      tenant: { connect: { id: tenantId } },
      email,
      name,
      phone,
      role,
      serviceIds,
      token,
      expiresAt,
    });

    // TODO: send invitation email via email service
    console.log('Sending email ' + invitation.email);

    return { success: true };
  }

  async accept(token: string): Promise<{ message: string }> {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Esta invitación ya fue utilizada o expiró');
    }

    if (invitation.expiresAt < new Date()) {
      await this.invitationsRepository.updateStatus(token, 'EXPIRED');
      throw new BadRequestException('La invitación ha expirado');
    }

    await this.invitationsRepository.updateStatus(token, 'ACCEPTED');

    // TODO: create user account + membership + assign services

    return { message: 'Invitación aceptada correctamente' };
  }

  async getAll(tenantId: string) {
    return this.invitationsRepository.findAllByTenant(tenantId);
  }
}
