import { SubscriptionWebhookService } from './subscription-webhook.service';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
// src/modules/subscriptions/subscriptions.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
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
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionWebhookService: SubscriptionWebhookService,
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

  /**
   * Generates an authenticated, single-use URL for the Lemon Squeezy Customer Portal.
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
