import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from '../availability/availability.service';
import { AvailabilityRepository } from './availability.repository';
import { SlotsGenerator } from './slots-generator';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, SlotsGenerator, AvailabilityRepository],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
