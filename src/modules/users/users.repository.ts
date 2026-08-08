import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BaseRepository } from 'src/common/database/base.repository';
import { UserUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { MembershipStatus } from 'src/generated/prisma/enums';

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

  async findMeContext(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE,
          },
          select: {
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                onboardingStatus: true,
                professionals: {
                  where: {
                    userId,
                    isActive: true,
                  },
                  select: {
                    id: true,
                  },
                },
                subscription: {
                  select: {
                    status: true,
                    plan: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
