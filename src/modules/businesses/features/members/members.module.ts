import { Module } from '@nestjs/common';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  providers: [MembersRepository, MembersService],
  exports: [MembersService],
})
export class MembersModule {}
