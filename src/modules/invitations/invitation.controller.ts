import { Controller, Post, UseGuards } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BusinessGuard } from 'src/auth/guards/business.guard';
import { BusinessRoles } from 'src/auth/decorators/business-roles.decorator';
import { StaffRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(StaffRole.OWNER, StaffRole.ADMIN)
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  async create() {}
}
