import bcrypt from 'bcryptjs';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Prisma } from 'src/generated/prisma/client';
import { UserUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }

  async findByEmailOrFail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByGoogleId(googleId: string) {
    const user = await this.userRepository.findByGoogleId(googleId);
    return user;
  }

  async getUserWithBusiness(id: string) {
    const user = await this.userRepository.findByIdWithBusiness(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async searchUsers(filters: { search?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    return this.userRepository.findManyWithFilters({
      search: filters.search,
      page,
      limit,
    });
  }

  async create(data: CreateUserDto, tx?: Prisma.TransactionClient) {
    return await this.userRepository.create(data, tx);
  }

  async update(id: string, data: UserUpdateInput, tx?: Prisma.TransactionClient) {
    return await this.userRepository.update(id, data, tx);
  }

  async markEmailVerified(id: string, tx?: Prisma.TransactionClient) {
    return await this.userRepository.markEmailAsVerified(id, tx);
  }

  async markPhoneVerified(id: string, tx?: Prisma.TransactionClient) {
    return await this.userRepository.markPhoneAsVerified(id, tx);
  }
}
