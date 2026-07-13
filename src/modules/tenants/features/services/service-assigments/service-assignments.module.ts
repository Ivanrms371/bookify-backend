import { Module } from '@nestjs/common';
import { EmployeesModule } from '../../employees/employees.module';
import { ServicesModule } from '../services/services.module';
import { ServiceAssignmentsController } from './service-assignments.controller';
import { ServiceAssignmentsService } from './service-assignments.service';
import { ServiceAssignmentsRepository } from './service-assignments.repository';
import { GuardsModule } from 'src/common/guards/guards.module';

@Module({
  imports: [GuardsModule, EmployeesModule, ServicesModule],
  controllers: [ServiceAssignmentsController],
  providers: [ServiceAssignmentsService, ServiceAssignmentsRepository],
  exports: [ServiceAssignmentsService],
})
export class ServiceAssignmentsModule {}
