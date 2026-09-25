import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsRepository } from './memberships.repository';

@Module({
  controllers: [],
  providers: [MembershipsService, MembershipsRepository],
  exports: [MembershipsService],
})
export class MembershipsModule {}
