import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { BaseRepository } from 'src/common/database/base.repository';
import { UserUpdateInput } from 'src/generated/prisma/models';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateUserDto, client?: Prisma.TransactionClient) {
    return this.db(client).user.create({ data });
  }

  async update(id: string, data: UserUpdateInput, client?: Prisma.TransactionClient) {
    return this.db(client).user.update({ data, where: { id } });
  }

  async findByEmail(email: string, client?: Prisma.TransactionClient) {
    return this.db(client).user.findUnique({ where: { email } });
  }

  async findById(userId: string, client?: Prisma.TransactionClient) {
    return this.db(client).user.findUnique({ where: { id: userId } });
  }

  async markEmailVerified(userId: string, client?: Prisma.TransactionClient) {
    return this.db(client).user.update({
      data: { emailVerifiedAt: new Date() },
      where: { id: userId },
    });
  }

  async markPhoneVerified(userId: string, client?: Prisma.TransactionClient) {
    return this.db(client).user.update({
      data: { phoneVerifiedAt: new Date() },
      where: { id: userId },
    });
  }
}
