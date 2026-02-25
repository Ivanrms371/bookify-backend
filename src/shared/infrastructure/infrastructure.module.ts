import { Module } from '@nestjs/common';
import { AvailabilityQuery } from './queries/availability.query';

@Module({
  providers: [AvailabilityQuery],
  exports: [AvailabilityQuery],
})
export class InfrastructureModule {}
