import { PlanChangeSelectionDto } from './dto/plan-change-selection.dto';
import { PlanChangeService } from './plan-change.service';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  RawBody,
  UnauthorizedException,
} from '@nestjs/common';
import { CheckoutSelectionDto } from './dto/checkout.dto';
import { Public } from 'src/common/security/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentTenant, GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionWebhookService: SubscriptionWebhookService,
    private readonly planChanges: PlanChangeService,
  ) {}

  /**
   * Retrieves the current subscription state for the authenticated workspace.
   */
  @Permissions(PERMISSIONS.BILLING_READ)
  @Get('current')
  async getCurrentSubscription(@GetTenantId() tenantId: string) {
    return this.subscriptionsService.getBillingSummary(tenantId);
  }

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getCatalog();
  }

  @Get('access')
  getAccess(@GetTenantId() tenantId: string, @CurrentTenant('permissions') permissions: readonly string[]) {
    return this.subscriptionsService.getAccess(tenantId, permissions.includes(PERMISSIONS.BILLING_MANAGE));
  }

  /**
   * Generates a signed Lemon Squeezy checkout session URL for purchasing an eligible paid plan.
   */
  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Get('eligibility')
  getEligibility(@GetTenantId() tenantId: string, @Query() dto: CheckoutSelectionDto) {
    return this.subscriptionsService.getCheckoutEligibility(tenantId, dto.planId, dto.cycle);
  }

  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Post('checkout')
  async createCheckout(@Body() dto: CheckoutSelectionDto, @CurrentUser() user: AuthenticatedUser, @GetTenantId() tenantId: string) {
    const checkoutUrl = await this.subscriptionsService.createCheckoutSession(tenantId, user.email, user.name, dto.planId, dto.cycle);

    return { url: checkoutUrl };
  }

  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Get('change-eligibility')
  getChangeEligibility(@GetTenantId() tenantId: string, @Query() dto: PlanChangeSelectionDto) {
    return this.planChanges.getEligibility(tenantId, dto);
  }

  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Post('plan-change')
  changePlan(@GetTenantId() tenantId: string, @Body() dto: PlanChangeSelectionDto) {
    return this.planChanges.change(tenantId, dto);
  }

  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Delete('plan-change')
  cancelPlanChange(@GetTenantId() tenantId: string) {
    return this.planChanges.cancel(tenantId);
  }

  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Post('plan-change/refresh')
  refreshPlanChange(@GetTenantId() tenantId: string) {
    return this.planChanges.refresh(tenantId);
  }

  /**
   * Generates a fresh authenticated URL for the Lemon Squeezy Customer Portal.
   */
  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Get('portal')
  async getCustomerPortal(@GetTenantId() tenantId: string) {
    const portalUrl = await this.subscriptionsService.getCustomerPortalSession(tenantId);
    return { url: portalUrl };
  }

  /**
   * Public webhook receiver endpoint for Lemon Squeezy asynchronous lifecycle events.
   * Note: Expects the request rawBody Buffer to be preserved via NestFactory configuration.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@RawBody() rawBody: Buffer | undefined, @Headers('x-signature') signature: string) {
    if (!signature) {
      throw new UnauthorizedException('Missing x-signature header.');
    }

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      this.logger.error('Webhook rawBody buffer is missing. Ensure { rawBody: true } is configured in NestFactory.create.');
      throw new BadRequestException('Invalid request body payload.');
    }

    await this.subscriptionWebhookService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
