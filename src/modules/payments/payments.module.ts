import { PaymentsController } from './payments.controller';
import { LemonSqueezyModule } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.module';
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  imports: [LemonSqueezyModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
