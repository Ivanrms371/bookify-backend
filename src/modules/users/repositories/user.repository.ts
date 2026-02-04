import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserUpdateInput } from 'src/generated/prisma/models';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdWithBusiness(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.findUnique({
      where: { id },
      include: {
        businesses: true,
      },
    });
  }

  async findManyWithFilters(filters: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const take = limit;

    return this.prisma.user.findMany({
      where: {
        name: { contains: search },
      },
      skip,
      take,
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.findUnique({ where: { id } });
  }

  async findByGoogleId(googleId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.findUnique({ where: { googleId } });
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDto, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.create({ data });
  }

  async update(id: string, data: UserUpdateInput, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.update({ where: { id }, data });
  }

  async markEmailAsVerified(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  }

  async markPhoneAsVerified(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.user.update({ where: { id }, data: { phoneVerifiedAt: new Date() } });
  }
}
