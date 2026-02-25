import { Module } from '@nestjs/common';
import { InfrastructureModule } from 'src/shared/infrastructure/infrastructure.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { SlotsGenerator } from './slots.generator';

@Module({
  imports: [InfrastructureModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, SlotsGenerator],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
