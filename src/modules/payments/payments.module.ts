import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';

@Module({
  imports: [PrismaModule],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentsModule {}
