import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
