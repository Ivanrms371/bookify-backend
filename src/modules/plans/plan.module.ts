import { forwardRef, Module } from '@nestjs/common';
import { PlanRepository } from './plan.repository';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { BusinessModule } from '../businesses/business.module';
import { MercadoPagoModule } from 'src/mercadopago/mercadopago.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    MercadoPagoModule,
    forwardRef(() => AuthModule),
    forwardRef(() => BusinessModule),
  ],
  controllers: [PlanController],
  providers: [PlanService, PlanRepository],
  exports: [PlanService],
})
export class PlanModule {}
