import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BusinessGuard } from 'src/auth/guards/business.guard';
import { BusinessRoles } from 'src/auth/decorators/business-roles.decorator';
import { StaffRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(StaffRole.OWNER)
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
  async startTrial(@Body() body: { businessId: string; planId: string }) {
    return this.subscriptionService.startTrial(body.businessId, body.planId);
  }

  /**
   * POST /subscriptions/paid
   * Create a paid subscription
   */
  @Post('paid')
  async createPaid(@Body() body: { businessId: string; planId: string }) {
    return this.subscriptionService.createPaidSubscription(body.businessId, body.planId);
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
