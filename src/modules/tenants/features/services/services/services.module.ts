import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { GuardsModule } from 'src/common/guards/guards.module';
import { MediaModule } from 'src/shared/media/media.module';

@Module({
  imports: [GuardsModule, MediaModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
