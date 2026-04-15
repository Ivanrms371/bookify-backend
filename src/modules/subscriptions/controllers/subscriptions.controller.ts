import { Body, Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { PlanType, MembershipRole } from 'src/generated/prisma/enums';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@MembershipRoles(MembershipRole.OWNER)
@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * POST /subscriptions/free
   * Create a free subscription
   */

  @Post('free')
  async createFree(@Body() body: { tenantId: string }) {
    return this.subscriptionService.createFreeSubscription(body.tenantId);
  }

  /**
   * POST /subscriptions/trial
   * Start a trial
   */
  @Post('trial')
  async startTrial(@Body() body: { tenantId: string; planType: PlanType }) {
    return this.subscriptionService.startTrial(body.tenantId, body.planType);
  }

  /**
   * POST /subscriptions/paid
   * Create a paid subscription
   */
  @Post('paid')
  async createPaid(@Body() body: { tenantId: string; planType: PlanType }) {
    return this.subscriptionService.createPaidSubscription(body.tenantId, body.planType);
  }

  /**
   * POST /subscriptions/downgrade
   * Get subscription of a tenant
   */
  @Post('tenant')
  async getMyTenant(@Body() body: { tenantId: string }) {
    // return this.subscriptionService.
  }

  /**
   * POST /subscriptions/cancel
   * Cancel a subscription
   */
  @Post(':id')
  async cancel(@Body() body: { tenantId: string }) {
    return this.subscriptionService.cancelSubscription(body.tenantId);
  }
}
