import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { StaffsModule } from '../../staffs/staffs.module';
import { MembersModule } from 'src/modules/businesses/features/members/members.module';

@Module({
  imports: [AuthModule, UsersModule, StaffsModule, MembersModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
