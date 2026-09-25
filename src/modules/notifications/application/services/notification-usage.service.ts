import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { TenantUsageService } from 'src/modules/tenants/features/usage/tenant-usage.service';

@Injectable()
export class NotificationUsageService {
  constructor(private readonly tenantUsageService: TenantUsageService) {}

  async canSend(tenantId: string | null, channel: NotificationChannel) {
    return true;
    // if (!tenantId) {
    //   return true && channel !== NotificationChannel.WHATSAPP;
    // }
    // const quota = await this.tenantUsageService.findByTenantId(tenantId);
    // if (!quota) {
    //   return false;
    // }
    // switch (channel) {
    //   case NotificationChannel.EMAIL:
    //     return quota.emailCount < quota.emailLimit;
    //   case NotificationChannel.WHATSAPP:
    //     return quota.whatsappCount < quota.whatsappLimit;
    //   default:
    //     return true;
    // }
  }

  async incrementUsage(tenantId: string | null, channel: NotificationChannel) {
    if (!tenantId) {
      return;
    }
    const quota = await this.tenantUsageService.findByTenantId(tenantId);
    if (!quota) {
      return;
    }
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.tenantUsageService.incrementEmailCount(tenantId);
      case NotificationChannel.WHATSAPP:
        return await this.tenantUsageService.incrementWhatsappCount(tenantId);
      default:
        return;
    }
  }
}
