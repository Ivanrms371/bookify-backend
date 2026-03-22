import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { BusinessOnboardingService } from '../business-onboarding.service';
import { SelectPlanDto } from '../dto/select-plan.dto';
import { UpdateBusinessAddressDto } from '../dto/update-business-address.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';

@UseGuards(JwtAuthGuard)
@Controller('business/:businessId/onboarding')
export class BusinessOnboardingController {
  constructor(private readonly businessOnboardingService: BusinessOnboardingService) {}

  @Post('select-plan')
  async selectPlan(@Req() req: AuthenticatedRequest, @Body() dto: SelectPlanDto) {
    const { businessId } = req.params;
    const { userId } = req.user;
    return this.businessOnboardingService.selectPlan(businessId, userId, dto);
  }

  @Get('checklist')
  async getChecklist(@Req() req: AuthenticatedRequest) {
    const { businessId } = req.params;
    const { userId } = req.user;
    return this.businessOnboardingService.getChecklist(businessId, userId);
  }

  @Post('complete')
  async completeOnboarding(@Req() req: AuthenticatedRequest) {
    const { businessId } = req.params;
    const { userId } = req.user;
    return this.businessOnboardingService.completeOnboarding(businessId, userId);
  }

  @Post('address')
  async updateAddress(@Req() req: AuthenticatedRequest, @Body() dto: UpdateBusinessAddressDto) {
    const { businessId } = req.params;
    const { userId } = req.user;
    return this.businessOnboardingService.updateAddress(businessId, userId, dto);
  }

  @Post('availability')
  async updateAvailability(@Req() req: AuthenticatedRequest, @Body() dto: UpdateAvailabilityDto) {
    const { businessId } = req.params;
    const { userId } = req.user;
    return this.businessOnboardingService.updateAvailability(businessId, userId, dto);
  }

  @Post('assets')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async updateAssets(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const businessId = req.params.businessId;
    const { userId } = req.user;
    return this.businessOnboardingService.updateAssets(businessId, userId, files);
  }
}
