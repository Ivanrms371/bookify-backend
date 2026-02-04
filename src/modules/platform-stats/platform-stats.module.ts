import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PlatformStatsController } from './platform-stats.controller';
import { PlatformStatsService } from './platform-stats.service';
import { PlatformStatsRepository } from './platform-stats.repository';
import { PlatformStatsScheduler } from './platform-stats.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformStatsController],
  providers: [PlatformStatsService, PlatformStatsScheduler, PlatformStatsRepository],
  exports: [PlatformStatsService],
})
export class PlatformStatsModule {}
