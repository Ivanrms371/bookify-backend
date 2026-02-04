import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { BusinessModule } from '../businesses/business.module';
import { ServiceAssigmentController } from './controllers/service-assigment.controller';
import { ServiceManagementController } from './controllers/service-managment.controller';
import { ServiceAssigmentRepository } from './repositories/service-assigment.repository';
import { ServiceRepository } from './repositories/service.repository';
import { ServiceAssigmentService } from './services/service-assigment.service';
import { ServiceManagementService } from './services/service-managment.service';
import { StaffModule } from '../staffs/staff.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, StaffModule, BusinessModule],
  controllers: [ServiceAssigmentController, ServiceManagementController],
  providers: [
    ServiceRepository,
    ServiceAssigmentRepository,
    ServiceAssigmentService,
    ServiceManagementService,
  ],
  exports: [ServiceAssigmentService, ServiceManagementService],
})
export class ServiceModule {}
