import { Module } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { MercadoPagoModule } from 'src/shared/integrations/mercadopago/mercadopago.module';
import { GuardsModule } from 'src/common/guards/guards.module';

@Module({
  imports: [GuardsModule, MercadoPagoModule],
  controllers: [PlansController],
  providers: [PlansService, PlansRepository],
  exports: [PlansService],
})
export class PlansModule {}
