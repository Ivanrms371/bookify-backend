import { Module } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MercadoPagoModule } from 'src/mercadopago/mercadopago.module';

@Module({
  imports: [PrismaModule, UsersModule, MercadoPagoModule, AuthModule],
  controllers: [PlansController],
  providers: [PlansService, PlansRepository],
  exports: [PlansService],
})
export class PlansModule {}
