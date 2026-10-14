import { Module } from '@nestjs/common';
import { VerificationsService } from './core/verifications.service';
import { UsersModule } from '../users/users.module';
import { VerificationsRepository } from './verifications.repository';

@Module({
  imports: [UsersModule],
  providers: [VerificationsService, VerificationsRepository],
  exports: [VerificationsService],
})
export class VerificationsModule {}
