import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { NotificationsService } from './application/services/notifications.service';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly inAppNotificationsService: InAppNotificationsService) {}

  @Get()
  async getCountInAppNotifications(@Req() req: AuthenticatedRequest) {
    return this.inAppNotificationsService.count(req.user.userId);
  }
}
