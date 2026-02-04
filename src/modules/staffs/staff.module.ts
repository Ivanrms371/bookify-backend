import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffRepository } from './staff.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [StaffService, StaffRepository],
  exports: [StaffService],
})
export class StaffModule {}
