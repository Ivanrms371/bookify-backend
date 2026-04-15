import { Controller, Get, Post, Req, Patch, Param } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly inAppNotificationsService: InAppNotificationsService) {}

  @Get()
  async getNotificationsData(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const [count, notifications] = await Promise.all([
      this.inAppNotificationsService.count(userId),
      this.inAppNotificationsService.getLatest(userId),
    ]);
    return { count, notifications };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.inAppNotificationsService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inAppNotificationsService.markAsRead(id, req.user.userId);
  }
}
