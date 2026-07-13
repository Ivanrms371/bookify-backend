import { Module } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { EmployeesModule } from '../employees/employees.module';
import { UsersModule } from 'src/modules/users/users.module';
import { ServiceAssignmentsModule } from '../services/service-assigments/service-assignments.module';
import { TenantUsageModule } from '../usage/tenant-usage.module';

@Module({
  imports: [EmployeesModule, UsersModule, ServiceAssignmentsModule, TenantUsageModule],
  controllers: [MembershipsController],
  providers: [MembershipsRepository, MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
