import bcrypt from 'bcryptjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from 'src/generated/prisma/client';
import { CreateFromInvitationDto } from './dto/create-from-invitation.dto';
import { UserCreateInput, UserUpdateInput } from 'src/generated/prisma/models';
import { MeUserMapper, ProfileMapper } from './mappers/user-mapper';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: UserCreateInput, tx?: Prisma.TransactionClient) {
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

  async findMeById(userId: string, preferredTenant?: string) {
    const rawData = await this.usersRepository.findMeContext(userId);

    if (!rawData) {
      throw new NotFoundException('User not found');
    }

    return MeUserMapper.toDomain(rawData, preferredTenant);
  }

  async getProfile(userId: string, tenantId: string) {
    const userWithProf = await this.usersRepository.findProfileWithProfessional(userId, tenantId);
    if (!userWithProf) throw new NotFoundException('User not found');
    return ProfileMapper.toProfileDto(userWithProf);
  }

  async update(id: string, data: UserUpdateInput, tx?: Prisma.TransactionClient) {
    const user = await this.usersRepository.findById(id, tx);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersRepository.update(id, data, tx);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    return await this.usersRepository.findByEmail(email.trim().toLowerCase(), tx);
  }

  async findByEmailOrFail(email: string) {
    const user = await this.usersRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByGoogleId(googleId: string) {
    return await this.usersRepository.findByGoogleId(googleId);
  }

  async markEmailAsVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.update(id, { emailVerifiedAt: new Date() }, tx);
  }

  async markPhoneAsVerified(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.update(id, { phoneVerifiedAt: new Date() }, tx);
  }

  async incrementTokenVersion(userId: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.update(userId, { tokenVersion: { increment: 1 } }, tx);
  }

  async updateLastLogin(userId: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.update(userId, { lastLoginAt: new Date() }, tx);
  }
}
