import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentRepository } from './payment.repository';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async generateReferenceCode(tx?: Prisma.TransactionClient) {
    const now = new Date();
    const year = now.getFullYear();
    const offset = 50;

    const lastInvoice = await this.paymentRepository.findLast(tx);
    const nextNumber = lastInvoice
      ? parseInt(lastInvoice.referenceCode.split('-')[2]) + 1
      : offset + 1;

    const code = `PAY-${year}-${nextNumber.toString().padStart(4, '0')}`;

    return { code, nextNumber };
  }

  async upsertPayment(payment: CreatePaymentDto, tx?: Prisma.TransactionClient) {
    const existingPayment = await this.paymentRepository.findByExternalId(payment.externalId, tx);
    if (existingPayment) {
      return this.paymentRepository.update(payment, tx);
    }

    const { code, nextNumber } = await this.generateReferenceCode(tx);

    const paymentData = {
      ...payment,
      referenceCode: code,
      sequenceNumber: nextNumber,
      business: { connect: { id: payment.businessId } },
      subscription: payment.subscriptionId
        ? { connect: { id: payment.subscriptionId } }
        : undefined,
    };

    return this.paymentRepository.create(paymentData, tx);
  }
}
