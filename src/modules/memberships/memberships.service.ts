import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { MembershipUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembershipsService {
  constructor(private readonly membershipsRepository: MembershipsRepository) {}

  async findAll(tenantId: string) {
    return this.membershipsRepository.findMany(tenantId);
  }

  async findById(tenantId: string, id: string) {
    const membership = await this.membershipsRepository.findById(tenantId, id);
    if (!membership) throw new NotFoundException('Membresía no encontrada');
    return membership;
  }

  async findByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.membershipsRepository.findByUserId(tenantId, userId, tx);
  }

  async create(tenantId: string, userId: string, role: string) {
    return this.membershipsRepository.create(tenantId, userId, role);
  }

  async update(tenantId: string, id: string, data: MembershipUpdateInput, tx?: TransactionClient) {
    return this.membershipsRepository.update(tenantId, id, data, tx);
  }

  async delete(tenantId: string, id: string) {
    return this.membershipsRepository.delete(tenantId, id);
  }
}
