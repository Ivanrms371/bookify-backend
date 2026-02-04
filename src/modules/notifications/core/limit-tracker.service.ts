import { Injectable, Logger } from '@nestjs/common';
import { BusinessLimitsRepository } from '../analytics/repositories/business-limits.repository';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationContact } from '../types/notification.type';

@Injectable()
export class LimitTrackerService {
  private readonly logger = new Logger(LimitTrackerService.name);

  constructor(private readonly businessLimitsRepository: BusinessLimitsRepository) {}

  /**
   * Checks which what channel send the notification,
   * @returns 'whatsapp' if is under the limit, 'email' if is over the limit.
   */
  async checkChannel(
    businessId: string,
    contact: NotificationContact,
  ): Promise<NotificationChannel> {
    const limits = await this.getLimits(businessId);

    if (limits.whatsappCount >= limits.whatsappLimit) {
      this.logger.warn(
        `📧 Business ${businessId} reached WhatsApp limit (${limits.whatsappCount}/${limits.whatsappLimit}). Using email.`,
      );
      if (!contact.email) {
        throw new Error('No email provided');
      }
      return NotificationChannel.EMAIL;
    }

    const usage = (limits.whatsappCount / limits.whatsappLimit) * 100;

    if (usage >= 80 && usage < 100) {
      this.logger.log(`⚠️ Business ${businessId} at ${Math.round(usage)}% of WhatsApp limit`);

      // TODO: Send warning notification to owner about high use.
    }

    return NotificationChannel.WHATSAPP;
  }

  /**
   * Increment counters after send a notification
   */

  async increment(businessId: string, channel: NotificationChannel, cost: number) {
    if (channel === NotificationChannel.WHATSAPP) {
      await this.businessLimitsRepository.incrementWhatsapp(businessId, cost);
    } else {
      await this.businessLimitsRepository.incrementEmail(businessId);
    }
  }

  /**
   *  Get stats of use of current month
   */
  async getStats(businessId: string) {
    const limits = await this.getLimits(businessId);

    return {
      plan: limits.plan,
      whatsapp: {
        sent: limits.whatsappCount,
        limit: limits.whatsappLimit,
        remaining: Math.max(0, limits.whatsappLimit - limits.whatsappCount),
        cost: limits.whatsappCost.toNumber(),
        percentage:
          limits.whatsappLimit > 0
            ? Math.round((limits.whatsappCount / limits.whatsappLimit) * 100)
            : 0,
      },
      email: {
        sent: limits.emailCount,
      },
      professionals: {
        limit: limits.professionalLimit,
      },
    };
  }

  /**
   * Check if business can add a professional
   * @param businessId
   * @param currentCount
   * @returns
   */

  async canAddProfessional(businessId: string, currentCount: number) {
    const limits = await this.getLimits(businessId);
    return currentCount < limits.professionalLimit;
  }

  /**
   * Upgrade plan
   * @param businessId
   * @param newPlan
   */

  async upgradePlan(businessId: string, newPlan: string) {
    // const planLimits = await this.plans

    await this.businessLimitsRepository.update(businessId, {
      plan: 'FREE',
      whatsappLimit: 0,
      professionalLimit: 1,
    });

    // this.logger.log(`✅ Business ${businessId} upgraded to ${newPlan.toUpperCase()}`);
  }

  /**
   * Get or create business limits
   * @param businessId
   * @returns
   */

  private async getLimits(businessId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let limits = await this.businessLimitsRepository.findByBusinessId(businessId);

    if (!limits) {
      limits = await this.businessLimitsRepository.create({
        businessId,
        plan: 'FREE',
        whatsappLimit: 100,
        professionalLimit: 10,
        periodMonth: currentMonth,
        periodYear: currentYear,
        lastResetAt: now,
      });

      this.logger.log(`✅ Created limits for business ${businessId} (Plan: FREE)`);
      return limits;
    }

    if (limits.periodMonth !== currentMonth || limits.periodYear !== currentYear) {
      limits = await this.businessLimitsRepository.resetCounters(
        businessId,
        currentMonth,
        currentYear,
      );

      this.logger.log(`✅ Reset limits for business ${businessId}`);
      return limits;
    }

    return limits;
  }
}
