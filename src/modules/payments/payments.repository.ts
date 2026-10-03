import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, skip: number, take: number) {
    const where = { tenantId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction(
      [
        this.prisma.payment.findMany({
          where,
          skip,
          take,
          orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            referenceCode: true,
            issuedAt: true,
            transactionAmount: true,
            transactionCurrency: true,
            status: true,
            invoiceUrl: true,
          },
        }),
        this.prisma.payment.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return { rows, total };
  }

  findForInvoice(tenantId: string, id: string) {
    return this.prisma.payment.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        externalId: true,
        invoiceUrl: true,
        subscription: { select: { tenantId: true, paymentProvider: true, lemonSubscriptionId: true, lemonCustomerId: true } },
      },
    });
  }

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
