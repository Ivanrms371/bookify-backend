import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
