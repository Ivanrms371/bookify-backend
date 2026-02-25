import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { StaffsModule } from '../../staffs/staffs.module';
import { ServicesModule } from '../services/services.module';
import { ServiceAssignmentsController } from './service-assignments.controller';
import { ServiceAssignmentsService } from './service-assignments.service';
import { ServiceAssignmentsRepository } from './service-assignments.repository';
import { MembersModule } from 'src/modules/businesses/features/members/members.module';

@Module({
  imports: [AuthModule, UsersModule, StaffsModule, MembersModule, ServicesModule],
  controllers: [ServiceAssignmentsController],
  providers: [ServiceAssignmentsService, ServiceAssignmentsRepository],
  exports: [ServiceAssignmentsService],
})
export class ServiceAssignmentsModule {}
