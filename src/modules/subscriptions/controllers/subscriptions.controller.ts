import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BusinessRoles } from 'src/common/decorators/business-roles.decorator';
import { PlanType, BusinessRole } from 'src/generated/prisma/enums';
import { BusinessGuard } from 'src/common/guards/business.guard';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(BusinessRole.OWNER)
@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * POST /subscriptions/free
   * Create a free subscription
   */

  @Post('free')
  async createFree(@Body() body: { businessId: string }) {
    return this.subscriptionService.createFreeSubscription(body.businessId);
  }

  /**
   * POST /subscriptions/trial
   * Start a trial
   */
  @Post('trial')
  async startTrial(@Body() body: { businessId: string; planType: PlanType }) {
    return this.subscriptionService.startTrial(body.businessId, body.planType);
  }

  /**
   * POST /subscriptions/paid
   * Create a paid subscription
   */
  @Post('paid')
  async createPaid(@Body() body: { businessId: string; planType: PlanType }) {
    return this.subscriptionService.createPaidSubscription(body.businessId, body.planType);
  }

  /**
   * POST /subscriptions/downgrade
   * Get subscription of a business
   */
  @Post('business')
  async getMyBusiness(@Body() body: { businessId: string }) {
    // return this.subscriptionService.
  }

  /**
   * POST /subscriptions/cancel
   * Cancel a subscription
   */
  @Post(':id')
  async cancel(@Body() body: { businessId: string }) {
    return this.subscriptionService.cancelSubscription(body.businessId);
  }
}
