import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { BusinessLimitsService } from 'src/modules/businesses/features/limits/business-limits.service';

@Injectable()
export class NotificationUsageService {
  constructor(private readonly limitsService: BusinessLimitsService) {}

  async canSend(businessId: string | null, channel: NotificationChannel) {
    if (!businessId) {
      return true && channel !== NotificationChannel.WHATSAPP;
    }
    const limits = await this.limitsService.findByBusinessId(businessId);
    if (!limits) {
      return false;
    }
    switch (channel) {
      case NotificationChannel.EMAIL:
        return limits.emailCount < limits.emailLimit;
      case NotificationChannel.WHATSAPP:
        return limits.whatsappCount < limits.whatsappLimit;
      default:
        return true;
    }
  }
}
