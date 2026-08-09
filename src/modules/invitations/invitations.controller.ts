import { Body, Controller, Get, Param, Post, UseGuards, Put, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * GET /invitations
   * Returns all invitations for the current tenant.
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get()
  getAll(@GetTenantId() tenantId: string) {
    return this.invitationsService.getAll(tenantId);
  }

  /**
   * POST /invitations/invite
   * Requires authentication + tenant context.
   * Creates an invitation record and triggers the email send.
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('invite')
  invite(@GetTenantId() tenantId: string, @Body() dto: CreateInviteDto) {
    return this.invitationsService.invite(tenantId, dto);
  }

  /**
   * PUT /invitations/:id
   * Requires authentication + tenant context.
   * Updates an invitation record.
   */
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Put(':id')
  update(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateInviteDto) {
    return this.invitationsService.update(tenantId, id, dto);
  }


  /**
   * GET /invitations/accept/:token
   * Public endpoint — the invited professional clicks the link in their email.
   * Validates the token and marks the invitation as accepted.
   */
  @Get('accept/:token')
  accept(@Param('token') token: string) {
    return this.invitationsService.accept(token);
  }
}
