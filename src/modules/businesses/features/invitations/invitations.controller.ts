import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BusinessGuard } from 'src/auth/guards/business.guard';
import { BusinessRoles } from 'src/auth/decorators/business-roles.decorator';
import { BusinessRole } from 'src/generated/prisma/enums';
import { BulkInviteDto } from './dto/bulk-invite.dto';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(BusinessRole.OWNER, BusinessRole.ADMIN)
@Controller('business/:businessId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('bulk')
  async bulkInvite(
    @Param('businessId') businessId: string,
    @Body() dto: BulkInviteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invitationsService.bulkInvite(businessId, dto, req.user);
  }

  @Get()
  async getInvitations(@Param('businessId') businessId: string) {}
}
