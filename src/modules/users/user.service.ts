import bcrypt from 'bcryptjs';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from 'src/generated/prisma/client';
import { UserUpdateInput } from 'src/generated/prisma/models';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: CreateUserDto, tx?: Prisma.TransactionClient) {
    const existing = await this.userRepository.findByEmail(data.email, tx);

    if (existing) {
      throw new BadRequestException('Ese email ya está en uso');
    }

    let passwordHash: string | undefined = undefined;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    const user = await this.userRepository.create({ ...data, password: passwordHash }, tx);

    return user;
  }

  async updateUser(id: string, data: UserUpdateInput, tx?: Prisma.TransactionClient) {
    const user = await this.userRepository.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.update(id, data, tx);
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async markUserEmailVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.userRepository.markEmailVerified(id, tx);
  }

  async markUserPhoneVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.userRepository.markPhoneVerified(id, tx);
  }
}
