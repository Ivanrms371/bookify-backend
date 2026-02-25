import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { CustomerCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPhone(businessId: string, phone: string) {
    return this.db().customer.findUnique({
      where: { businessId_phone: { businessId, phone } },
    });
  }

  async findById(id: string) {
    return this.db().customer.findUnique({ where: { id } });
  }

  async create(customer: CustomerCreateInput) {
    return this.db().customer.create({ data: customer });
  }
}
