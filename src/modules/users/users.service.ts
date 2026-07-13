import bcrypt from 'bcryptjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from 'src/generated/prisma/client';
import { CreateFromInvitationDto } from './dto/create-from-invitation.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UpdateUserInput } from './types/update-user.type';
import { mapMeResponse } from './mappers/me.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(data: CreateUserDto, tx?: Prisma.TransactionClient) {
    return await this.usersRepository.create({ ...data }, tx);
  }

  async findOrCreateFromInvitation(dto: CreateFromInvitationDto, tx?: Prisma.TransactionClient) {
    const existing = await this.usersRepository.findByEmail(dto.email, tx);
    if (existing) return existing;

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.usersRepository.create(
      {
        ...dto,
        password: hashedPassword,
        emailVerifiedAt: new Date(),
      },
      tx,
    );
  }

  async findMeById(userId: string) {
    const data = await this.usersRepository.getMe(userId);
    console.log('data', data);
    const map = mapMeResponse(data);
    return map;
  }

  async update(id: string, data: UpdateUserInput, tx?: Prisma.TransactionClient) {
    const user = await this.usersRepository.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersRepository.update(id, data, tx);
  }

  async updatePassword(id: string, hashedPassword: string, tx?: Prisma.TransactionClient) {
    const user = await this.usersRepository.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersRepository.update(id, { password: hashedPassword }, tx);
  }

  async findUserById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string) {
    return await this.usersRepository.findByEmail(email);
  }

  async findUserByEmailOrFail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findUserByGoogleId(googleId: string) {
    return await this.usersRepository.findByGoogleId(googleId);
  }

  async markUserEmailVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.markEmailVerified(id, tx);
  }

  async markUserPhoneVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.markPhoneVerified(id, tx);
  }

  async incrementTokenVersion(userId: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.incrementTokenVersion(userId, tx);
  }

  async updateLastLogin(userId: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.updateLastLogin(userId, tx);
  }
}
