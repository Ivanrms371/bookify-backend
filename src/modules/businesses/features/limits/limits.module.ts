import { Module } from '@nestjs/common';
import { BusinessLimitsService } from './limits.service';
import { BusinessLimitsRepository } from './limits.repository';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BusinessLimitsService, BusinessLimitsRepository],
  exports: [BusinessLimitsService],
})
export class LimitsModule {}
