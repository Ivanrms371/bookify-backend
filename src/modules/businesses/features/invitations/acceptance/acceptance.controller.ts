import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { InvitationsService } from '../invitations.service';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { Request, Response } from 'express';
import { CookieService } from 'src/shared/cookies/cookie.service';

@Controller('invitations')
export class AcceptanceController {
  constructor(
    private readonly cookieService: CookieService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Get(':token')
  async validateInvitation(@Param('token') token: string, @Res() res: Response) {
    try {
      const invitationToken = await this.invitationsService.findValidByToken(token);
      this.cookieService.set(res, 'invitation_token', invitationToken, {
        maxAge: 60 * 60 * 1000,
      });
      res.redirect('/');
    } catch (error) {
      res.redirect('/login');
    }
  }
  @Post('accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto, @Req() req: Request) {
    const invitationToken = this.cookieService.getOrFail(req, 'invitation_token');
    return this.invitationsService.acceptInvitation(invitationToken, dto);
  }
}
