import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { BusinessOnboardingService } from '../business-onboarding.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { InitOnboardingDto } from '../dto/init-onboarding.dto';

@UseGuards(JwtAuthGuard)
@Controller('business/onboarding')
export class BusinessOnboardingInitController {
  constructor(private readonly businessOnboardingService: BusinessOnboardingService) {}

  @Post('setup')
  async setupOnboarding(@Req() req: AuthenticatedRequest, @Body() dto: InitOnboardingDto) {
    const { userId } = req.user;
    console.log('Setup Onboarding', dto);
    return this.businessOnboardingService.initializeBusiness(userId, dto);
  }

  @Get('status')
  async getOnboardingStatus(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    console.log();
    return this.businessOnboardingService.getOnboardingStatus(userId);
  }
}
