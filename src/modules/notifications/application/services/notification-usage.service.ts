import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { BusinessQuotaService } from 'src/modules/businesses/features/quota/business-quota.service';

@Injectable()
export class NotificationUsageService {
  constructor(private readonly quotaService: BusinessQuotaService) {}

  async canSend(businessId: string | null, channel: NotificationChannel) {
    if (!businessId) {
      return true && channel !== NotificationChannel.WHATSAPP;
    }
    const quota = await this.quotaService.findByBusinessId(businessId);
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
}
