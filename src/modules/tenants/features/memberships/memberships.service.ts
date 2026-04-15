import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { MembershipRole, MembershipStatus } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembershipsService {
  constructor(private readonly membershipsRepository: MembershipsRepository) {}

  async createOwner(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.membershipsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: userId } },
        role: MembershipRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
      tx,
    );
  }

  async addMember(tenantId: string, userId: string, role: MembershipRole, tx?: TransactionClient) {
    const existing = await this.membershipsRepository.findByUserAndTenant(userId, tenantId, tx);
    if (existing) {
      throw new ConflictException('Este usuario ya pertenece al negocio');
    }
  }

  async findByUserAndTenant(userId: string, tenantId: string, tx?: TransactionClient) {
    const member = await this.membershipsRepository.findByUserAndTenant(userId, tenantId, tx);
    if (!member) {
      throw new NotFoundException('No hemos encontrado el negocio');
    }
    return member;
  }
}
