import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { StaffStatsService } from './staff-stats.service';

@Module({
  imports: [PrismaModule],
  providers: [StaffStatsService],
  exports: [StaffStatsService],
})
export class StaffStatsModule {}
