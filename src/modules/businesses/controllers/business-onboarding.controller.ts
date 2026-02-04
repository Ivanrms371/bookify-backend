import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { BusinessOnboardingService } from '../services/business-onboarding.service';
import { OnboardingBusinessStep1DTO, OnboardingBusinessStep2DTO } from '../dto/onboarding.dto';
import { UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { BusinessGuard } from 'src/auth/guards/business.guard';
import { BusinessRoles } from 'src/auth/decorators/business-roles.decorator';
import { StaffRole } from 'src/generated/prisma/enums';

@UseGuards(JwtAuthGuard, BusinessGuard)
@BusinessRoles(StaffRole.OWNER)
@Controller('business/onboarding')
export class BusinessOnboardingController {
  constructor(private readonly businessOnboardingService: BusinessOnboardingService) {}

  @Get('/:businessId')
  async getOnboardingStatus(
    @Req() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ) {
    return this.businessOnboardingService.getBusinessOnboarding(req.user.userId, businessId);
  }

  @Post('/:businessId')
  async onboardingBusinessStep1(
    @Body() data: OnboardingBusinessStep1DTO,
    @Req() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessOnboardingService.onboardingBusinessStep1(data, req.user.userId, businessId);

    return {
      status: 'success',
      message: 'La información básica se ha actualizado correctamente',
    };
  }

  @Post('address/:businessId')
  async onboardingBusinessStep2(
    @Body() data: OnboardingBusinessStep2DTO,
    @Req() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ) {
    await this.businessOnboardingService.onboardingBusinessStep2(data, req.user.userId, businessId);

    return {
      status: 'success',
      message: 'La dirección se ha actualizado correctamente',
    };
  }

  @Post('assets/:businessId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async upload(
    @UploadedFiles() files: { logo?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @Req() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ) {
    const logo = files.logo?.[0];
    const cover = files.cover?.[0];

    const result = await this.businessOnboardingService.onboardingBusinessStep3(
      {
        logo,
        cover,
      },
      req.user.userId,
      businessId,
    );

    return {
      status: 'success',
      message: 'Las imágenes se han subido correctamente',
      data: result.data.business,
    };
  }
}
