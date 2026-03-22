import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { BusinessGuard } from 'src/common/guards/business.guard';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
@Controller('business/:businessId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('bulk')
  async bulkInvite(@Param('businessId') businessId: string, @Body() dto: BulkInviteDto, @Req() req: AuthenticatedRequest) {
    return this.invitationsService.bulkInvite(businessId, dto, req.user);
  }

  // Alias for single/bulk invite based on user request "POST /businesses/:businessId/invite"
  @Post('../invite')
  async inviteStaff(@Param('businessId') businessId: string, @Body() dto: BulkInviteDto, @Req() req: AuthenticatedRequest) {
    return this.invitationsService.bulkInvite(businessId, dto, req.user);
  }

  @Get()
  async getInvitations(@Param('businessId') businessId: string) {}
}
