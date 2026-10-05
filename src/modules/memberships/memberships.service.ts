import { Injectable } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { MembershipUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembershipsService {
  constructor(private readonly membershipsRepository: MembershipsRepository) {}

  async deactivateByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    const membership = await this.membershipsRepository.findByUserId(tenantId, userId, tx);
    if (membership) {
      return this.membershipsRepository.update(tenantId, membership.id, { isActive: false }, tx);
    }
  }

  async updateRoleByMembershipId(tenantId: string, membershipId: string, role: any, tx?: TransactionClient) {
    return this.membershipsRepository.update(tenantId, membershipId, { role }, tx);
  }

  async deactivateByMembershipId(tenantId: string, membershipId: string, tx?: TransactionClient) {
    return this.membershipsRepository.update(tenantId, membershipId, { isActive: false }, tx);
  }

  async updateRole(tenantId: string, userId: string, role: any, tx?: TransactionClient) {
    const membership = await this.membershipsRepository.findByUserId(tenantId, userId, tx);
    if (membership) {
      return this.membershipsRepository.update(tenantId, membership.id, { role }, tx);
    }
  }

  async findAll(tenantId: string) {
    return this.membershipsRepository.findMany(tenantId);
  }

  async findByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.membershipsRepository.findByUserId(tenantId, userId, tx);
  }

  async create(tenantId: string, userId: string, role: string, tx?: TransactionClient) {
    return this.membershipsRepository.create(tenantId, userId, role, tx);
  }

  async update(tenantId: string, id: string, data: MembershipUpdateInput, tx?: TransactionClient) {
    return this.membershipsRepository.update(tenantId, id, data, tx);
  }

  async delete(tenantId: string, id: string, tx?: TransactionClient) {
    return this.membershipsRepository.delete(tenantId, id, tx);
  }
}
