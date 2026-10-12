import { Controller, Get, Query, Req, Patch, Param, Put } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { InAppNotificationsService } from './application/services/in-app-notifications.service';
import { ListInAppNotificationsDto } from './dto/list-in-app-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly inAppNotificationsService: InAppNotificationsService) {}

  @Get()
  async getNotificationsData(@Req() req: AuthenticatedRequest, @Query() query: ListInAppNotificationsDto) {
    const userId = req.user.id;
    const [unreadCount, total, page] = await Promise.all([
      this.inAppNotificationsService.countUnread(req.tenantContext.tenantId!, userId),
      this.inAppNotificationsService.countTotal(req.tenantContext.tenantId!, userId),
      this.inAppNotificationsService.findPage(req.tenantContext.tenantId!, userId, query.limit, query.cursor),
    ]);
    return { unreadCount, total, ...page };
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.inAppNotificationsService.markAllAsRead(req.tenantContext.tenantId!, req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inAppNotificationsService.markAsRead(id, req.tenantContext.tenantId!, req.user.id);
  }
}
