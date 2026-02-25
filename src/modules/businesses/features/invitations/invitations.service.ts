import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { addDays } from 'date-fns';

import { InvitationsRepository } from './invitations.repository';
import { StaffsService } from 'src/modules/staffs/staffs.service';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { BusinessLimitsService } from '../limits/business-limits.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AuthUser } from 'src/auth/types/express-request.type';
import { ConfigService } from '@nestjs/config';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UsersService } from 'src/modules/users/users.service';
import { BusinessesService } from 'src/modules/businesses/core/businesses.service';
import { MembersService } from '../members/members.service';
import { BusinessRole } from 'src/generated/prisma/enums';
import { Staff } from 'src/generated/prisma/client';

@Injectable()
export class InvitationsService {
  private readonly invitationTokenSecret: string;
  private readonly invitationTokenExpiresIn: jwt.SignOptions['expiresIn'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly businessesService: BusinessesService,
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly staffService: StaffsService,
    private readonly invitationsRepository: InvitationsRepository,
    private readonly businessLimitsService: BusinessLimitsService,
  ) {
    this.invitationTokenSecret = this.configService.getOrThrow<string>('INVITATION_TOKEN_SECRET');
    this.invitationTokenExpiresIn = (this.configService.get<string>('INVITATION_TOKEN_EXPIRES_IN') ?? '1h') as jwt.SignOptions['expiresIn'];
  }

  private async checkOverLimit(businessId: string, dto: BulkInviteDto) {
    const snapshot = await this.businessLimitsService.getProfessionalsSnapshot(businessId);
    const limit = snapshot.professionalLimit;
    const expectedCount = snapshot.professionalCount + dto.items.length;

    if (expectedCount > limit) {
      throw new Error('Límite de profesionales alcanzado');
    }
  }

  private generateInvitationToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  async bulkInvite(businessId: string, dto: BulkInviteDto, user: AuthUser) {
    await this.checkOverLimit(businessId, dto);

    const business = await this.businessesService.findBusinessById(businessId);

    const now = new Date();
    const expiresAt = addDays(now, 7);

    // Procesamos cada invitación y guardamos resultados por email
    const results = await Promise.all(
      dto.items.map(async (item) => {
        try {
          // 1. Check self-invitation
          if (item.email === user.email) {
            throw new ConflictException('No puedes invitarte a ti mismo');
          }

          // 2. Check if user is already staff
          const existingStaff = await this.staffService.findByEmailAndBusinessId(item.email, businessId);
          if (existingStaff) {
            throw new ConflictException('Ya existe un profesional con ese email');
          }

          // 3. Check pending invitation
          const existingInvitation = await this.invitationsRepository.findPendingByEmail(item.email, businessId);
          if (existingInvitation) {
            throw new ConflictException('Ya existe una invitación pendiente para este email');
          }

          // 4. Generate token
          const { rawToken, tokenHash } = this.generateInvitationToken();

          // 5. Create invitation in DB
          await this.invitationsRepository.create({
            business: { connect: { id: businessId } },
            inviter: { connect: { id: user.userId } },
            token: tokenHash,
            email: item.email,
            role: item.role,
            expiresAt,
          });

          // 6. Send email
          console.log('Enviando email a', rawToken);

          return { email: item.email, status: 'invited' };
        } catch (error: any) {
          return { email: item.email, status: 'error', message: error.message };
        }
      }),
    );

    return results;
  }

  async findValidByToken(token: string) {
    // const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    console.log(token);
    const invitation = await this.invitationsRepository.findValidByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }

    const invitationToken = jwt.sign(
      {
        id: invitation.id,
      },
      this.invitationTokenSecret,
      {
        expiresIn: this.invitationTokenExpiresIn,
      },
    );

    return invitationToken;
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const tokenData = jwt.verify(token, this.invitationTokenSecret) as { id: string };
    const invitation = await this.invitationsRepository.findPendingById(tokenData.id);
    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada.');
    }

    const business = await this.businessesService.findBusinessById(invitation.businessId);
    if (!business) {
      throw new NotFoundException('Negocio no encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await this.usersService.findOrCreateFromInvitation(
        {
          name: dto.name,
          email: invitation.email,
          phone: dto.phone,
          password: dto.password,
        },
        tx,
      );

      const member = await this.membersService.addMember(invitation.businessId, user.id, invitation.role, tx);

      let staff: Staff | null = null;
      if (invitation.role === BusinessRole.STAFF) {
        staff = await this.staffService.createFromInvite(
          {
            businessId: invitation.businessId,
            userId: user.id,
            role: invitation.role,
            displayName: dto.name,
          },
          tx,
        );
      }

      return {
        user,
        member,
        staff,
        invitation,
        business,
      };
    });
  }
}
