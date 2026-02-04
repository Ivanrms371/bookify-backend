import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { InvitationRepository } from './invitation.repository';
import { StaffService } from '../staffs/staff.service';
import { add } from 'date-fns';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly staffService: StaffService,
  ) {}

  async create(data: any) {
    const exists = await this.staffService.findExistingMember(data.email, data.businessId);
    if (exists) {
      throw new Error('Este profesional ya existe');
    }

    // Generate token and expiration date
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = add(new Date(), { days: 7 });

    const invite = await this.invitationRepository.create({
      ...data,
      token,
      expiresAt,
    });

    // send email

    return invite;
  }
}
