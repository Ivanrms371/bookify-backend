import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { TenantQuotaService } from 'src/modules/tenants/features/quota/tenant-quota.service';

@Injectable()
export class NotificationUsageService {
  constructor(private readonly quotaService: TenantQuotaService) {}

  async canSend(tenantId: string | null, channel: NotificationChannel) {
    if (!tenantId) {
      return true && channel !== NotificationChannel.WHATSAPP;
    }
    const quota = await this.quotaService.findByTenantId(tenantId);
    if (!quota) {
      return false;
    }
   
    switch (channel) {
      case NotificationChannel.EMAIL:
        return quota.emailCount < quota.emailLimit;
      case NotificationChannel.WHATSAPP:
        return quota.whatsappCount < quota.whatsappLimit;
      default:
        return true;
    }
  }

  async incrementUsage(tenantId: string | null, channel: NotificationChannel) {
    if (!tenantId) {
      return;
    }
    const quota = await this.quotaService.findByTenantId(tenantId);
    if (!quota) {
      return;
    }
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.quotaService.incrementEmailCount(tenantId);
      case NotificationChannel.WHATSAPP:
        return await this.quotaService.incrementWhatsappCount(tenantId);
      default:
        return;
    }
  }
}
