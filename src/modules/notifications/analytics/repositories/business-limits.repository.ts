import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessLimitDto, UpdateBusinessLimitDto } from '../dto/business-limit.dto';

@Injectable()
export class BusinessLimitsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByBusinessId(businessId: string) {
    return this.prisma.businessLimits.findUnique({ where: { businessId } });
  }

  async create(data: CreateBusinessLimitDto) {
    return this.prisma.businessLimits.create({ data });
  }

  async update(businessId: string, data: UpdateBusinessLimitDto) {
    return this.prisma.businessLimits.update({
      where: { businessId },
      data,
    });
  }

  async incrementWhatsapp(businessId: string, cost: number) {
    return this.prisma.businessLimits.update({
      where: { businessId },
      data: {
        whatsappCount: { increment: 1 },
        whatsappCost: { increment: cost },
      },
    });
  }

  async incrementEmail(businessId: string) {
    return this.prisma.businessLimits.update({
      where: { businessId },
      data: {
        emailCount: { increment: 1 },
      },
    });
  }

  async resetCounters(businessId: string, periodMonth: number, periodYear: number) {
    return this.prisma.businessLimits.update({
      where: { businessId },
      data: {
        periodMonth,
        periodYear,
        whatsappCount: 0,
        emailCount: 0,
        whatsappCost: 0,
        lastResetAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.businessLimits.findMany();
  }

  async findByPlan(plan: string) {
    return this.prisma.businessLimits.findMany({ where: { plan } });
  }
}
