import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { MediaModule } from 'src/shared/media/media.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}
