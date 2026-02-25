import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { UsersModule } from 'src/modules/users/users.module';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';
import { BusinessController } from './core/businesses.controller.ts';
import { BusinessesService } from './core/businesses.service';
import { BusinessImagesService } from './core/business-images.service';
import { BusinessesRepository } from './core/businesses.repository';
import { AppointmentCreatedListener } from './listeners/appointment-created.listener';
import { BusinessStatsModule } from './features/stats/business-stats.module';
import { BusinessLimitsModule } from './features/limits/business-limits.module';

@Module({
  imports: [CloudinaryModule, UsersModule, PlansModule, AuthModule, BusinessStatsModule, BusinessLimitsModule],
  controllers: [BusinessController],
  providers: [BusinessesService, BusinessImagesService, BusinessesRepository, AppointmentCreatedListener],
  exports: [BusinessesService, BusinessImagesService],
})
export class BusinessesModule {}
