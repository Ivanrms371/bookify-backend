import { Controller, Get, Post, Req, Patch, Param, Put } from '@nestjs/common';
import EventEmitter2 from 'eventemitter2';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly inAppNotificationsService: InAppNotificationsService) {}

  @Get()
  async getNotificationsData(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    const [unreadCount, notifications] = await Promise.all([
      this.inAppNotificationsService.countUnread(userId),
      this.inAppNotificationsService.findLatest(userId),
    ]);
    return { unreadCount, notifications };
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.inAppNotificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inAppNotificationsService.markAsRead(id, req.user.id);
  }
}
