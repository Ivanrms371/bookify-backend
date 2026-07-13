import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { LayoutPortalService } from '../../application/layout-portal.service';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';

@Controller('portal/layout')
export class LayoutPortalController {
  constructor(private readonly layoutService: LayoutPortalService) {}

  @Get('sidebar')
  async getSidebar(@Req() req: AuthenticatedRequest) {
    // return this.layoutService.getSidebar(req.user.userId);
  }
}
