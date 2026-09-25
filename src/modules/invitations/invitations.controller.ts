import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';

import { CurrentTenant } from 'src/common/security/decorators/current-tenant.decorator';

import { InvitationsService } from './invitations.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInviteDto) {
    return this.invitationsService.create(tenantId, dto);
  }

  @Delete(':id')
  revoke(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) invitationId: string) {
    return this.invitationsService.revoke(tenantId, invitationId);
  }

  @Get('validate/:token')
  async validate(@Param('token') token: string) {
    return this.invitationsService.verify(token);
  }

  @Post('accept/:token')
  accept(@Param('token') token: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.invitationsService.accept(token, currentUser.id, currentUser.email);
  }
}
