import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { StartSubscriptionDto } from './dto/start-subscription.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('start')
  async start(@Body() dto: StartSubscriptionDto) {
    return this.subscriptionsService.start(dto);
  }
}
