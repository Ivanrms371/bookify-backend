import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SelectPlanDto, UpdateAssetsDto, UpdateLocationDto, UpdateProfileDto } from '../../core/dto/onboarding.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { OnboardingService } from './onboarding.service';

@UseGuards(JwtAuthGuard)
@Controller('business/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('init')
  async initOnboarding(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.initializeBusiness(userId);
  }

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.getOnboardingStatus(userId);
  }

  @Patch('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.updateProfile(dto, userId);
  }

  @Patch('location')
  async updateLocation(@Body() dto: UpdateLocationDto, @Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.updateLocation(dto, userId);
  }

  @Patch('assets')
  async updateAssets(@Body() dto: UpdateAssetsDto, @Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.onboardingService.updateAssets(dto, userId);
  }

  @Patch('plan')
  async selectPlan(@Req() req: AuthenticatedRequest, @Body() dto: SelectPlanDto) {
    const { userId } = req.user;
    return this.onboardingService.completeOnboarding(dto, userId);
  }
}
