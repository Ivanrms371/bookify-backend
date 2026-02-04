import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payment: Prisma.PaymentCreateInput, tx?: Prisma.TransactionClient) {
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

  async update(payment: Prisma.PaymentUpdateInput, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    return db.payment.update({
      where: { externalId: payment.externalId?.toString() },
      data: payment,
    });
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
