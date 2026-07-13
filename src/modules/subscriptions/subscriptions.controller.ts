import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { StartSubscriptionDto } from './dto/start-subscription.dto';

@UseGuards(TenantGuard)
@MembershipRoles(MembershipRole.OWNER)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('start')
  async start(@Body() dto: StartSubscriptionDto) {
    return this.subscriptionsService.start(dto);
  }
}
