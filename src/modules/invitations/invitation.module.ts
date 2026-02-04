import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StaffModule } from '../staffs/staff.module';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { BusinessModule } from '../businesses/business.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, BusinessModule, StaffModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository],
  exports: [InvitationService],
})
export class InvitationModule {}
