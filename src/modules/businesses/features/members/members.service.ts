import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MembersRepository } from './members.repository';
import { BusinessRole } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  async createOwner(businessId: string, userId: string, tx?: TransactionClient) {
    return this.membersRepository.create(
      {
        business: { connect: { id: businessId } },
        user: { connect: { id: userId } },
        role: BusinessRole.OWNER,
      },
      tx,
    );
  }

  async addMember(businessId: string, userId: string, role: BusinessRole, tx?: TransactionClient) {
    const existing = await this.membersRepository.findByUserAndBusiness(userId, businessId, tx);
    if (existing) {
      throw new ConflictException('Este usuario ya pertenece al negocio');
    }
    return this.membersRepository.create({ business: { connect: { id: businessId } }, user: { connect: { id: userId } }, role }, tx);
  }

  async findByUserAndBusiness(userId: string, businessId: string, tx?: TransactionClient) {
    const member = await this.membersRepository.findByUserAndBusiness(userId, businessId, tx);
    if (!member) {
      throw new NotFoundException('No hemos encontrado el negocio');
    }
    return member;
  }
}
