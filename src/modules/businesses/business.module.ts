import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessService } from './services/business.service';
import { BusinessOnboardingService } from './services/business-onboarding.service';
import { BusinessImagesService } from './services/business-images.service';
import { BusinessRepository } from './repositories/business.repository';
import { BussinessController } from './controllers/business.controller';
import { BusinessOnboardingController } from './controllers/business-onboarding.controller';
import { BussinessSettingsController } from './controllers/business-settings.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { PlanModule } from '../plans/plan.module';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { StaffModule } from '../staffs/staff.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    UserModule,
    SubscriptionModule,
    StaffModule,
    forwardRef(() => PlanModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [BussinessController, BusinessOnboardingController, BussinessSettingsController],
  providers: [
    BusinessService,
    BusinessOnboardingService,
    BusinessImagesService,
    BusinessRepository,
  ],
  exports: [BusinessService, BusinessOnboardingService, BusinessImagesService],
})
export class BusinessModule {}
