import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/shared/infrastructure/infrastructure.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityConfigMapper } from './utils/availability-config.mapper';
import { SlotsGenerator } from './slots.generator';
import { ServicesModule } from '../services/services.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [InfrastructureModule, ServicesModule, AuthModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, SlotsGenerator, AvailabilityConfigMapper],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
