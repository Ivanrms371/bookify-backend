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
  RawBody,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionsService } from './subscriptions.service';
import { BillingCycle } from 'src/generated/prisma/enums';
import { PlanId } from './plans.config';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';

export class CreateCheckoutDto {
  @IsNotEmpty()
  planId: PlanId;

  @IsEnum(BillingCycle)
  cycle: BillingCycle;
}

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Retrieves the current subscription state for the authenticated workspace.
   */
  @Permissions(PERMISSIONS.BILLING_READ)
  @Get('current')
  async getCurrentSubscription(@GetTenantId() tenantId: string) {
    return this.subscriptionsService.getSubscriptionByTenantId(tenantId);
  }

  /**
   * Generates a signed Lemon Squeezy checkout session URL for purchasing or upgrading a plan.
   */
  @Permissions(PERMISSIONS.BILLING_MANAGE)
  @Post('checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto, @CurrentUser() user: AuthenticatedUser, @GetTenantId() tenantId: string) {
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

    await this.subscriptionsService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
