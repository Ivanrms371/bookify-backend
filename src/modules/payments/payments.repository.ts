import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payment: Prisma.PaymentUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    return db.payment.create({ data: payment });
  }

  async findLast(tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const payment = await db.payment.findFirst({
      orderBy: {
        sequenceNumber: 'desc',
      },
    });
    return payment;
  }

  async updateByExternalId(externalId: string, data: Prisma.PaymentUncheckedUpdateInput, tx: Prisma.TransactionClient) {
    return tx.payment.update({ where: { externalId }, data });
  }

  async findByExternalId(externalId: string, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const payment = await db.payment.findUnique({
      where: {
        externalId,
      },
    });
    return payment;
  }
}
