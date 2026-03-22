import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BaseRepository } from 'src/common/database/base.repository';
import { UserUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateUserDto, tx?: TransactionClient) {
    return this.db(tx).user.create({ data });
  }

  async update(id: string, data: UserUpdateInput, tx?: TransactionClient) {
    return this.db(tx).user.update({ data, where: { id } });
  }

  async findByEmail(email: string, tx?: TransactionClient) {
    return this.db(tx).user.findUnique({ where: { email } });
  }

  async findById(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.findUnique({ where: { id: userId } });
  }

  async findByGoogleId(googleId: string, tx?: TransactionClient) {
    return this.db(tx).user.findUnique({ where: { googleId } });
  }

  async getMeWithBusiness(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.findUnique({
      where: { id: userId },
      select: {
        avatarUrl: true,
        name: true,
        email: true,
        phone: true,
        businessMembers: {
          select: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                members: {
                  where: { userId },
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async markEmailVerified(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.update({
      data: { emailVerifiedAt: new Date() },
      where: { id: userId },
    });
  }

  async markPhoneVerified(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.update({
      data: { phoneVerifiedAt: new Date() },
      where: { id: userId },
    });
  }

  async incrementTokenVersion(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.update({
      data: { tokenVersion: { increment: 1 } },
      where: { id: userId },
    });
  }

  async updateLastLogin(userId: string, tx?: TransactionClient) {
    return this.db(tx).user.update({
      data: { lastLoginAt: new Date() },
      where: { id: userId },
    });
  }
}
