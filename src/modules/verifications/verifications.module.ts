import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './core/verifications.service';
import { VerificationsRepository } from './verifications.repository';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [UsersModule, CustomersModule],
  controllers: [VerificationsController],
  providers: [VerificationsService, VerificationsRepository],
  exports: [VerificationsService, VerificationsRepository],
})
export class VerificationsModule {}
