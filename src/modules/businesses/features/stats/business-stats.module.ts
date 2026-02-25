import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { BusinessStatsService } from './business-stats.service';

@Module({
  imports: [PrismaModule],
  providers: [BusinessStatsService],
  exports: [BusinessStatsService],
})
export class BusinessStatsModule {}
