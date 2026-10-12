import { TenantUsageService } from '../tenants/features/usage/tenant-usage.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import type { ServiceCreateManyArgs } from 'src/generated/prisma/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { GetServicesQueryDto } from './dto/get-services-query.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly prisma: PrismaService,
    private readonly tenantUsageService: TenantUsageService,
  ) {}

  async findAll(tenantId: string, query: GetServicesQueryDto) {
    return await this.servicesRepository.findMany(tenantId, query);
  }

  async findById(tenantId: string, id: string) {
    const service = await this.servicesRepository.findById(tenantId, id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async create(tenantId: string, data: CreateServiceDto, tx?: TransactionClient) {
    if (!tx) return this.prisma.$transaction((transaction) => this.create(tenantId, data, transaction));
    await this.tenantUsageService.assertCanAddServices(tenantId, 1, tx);
    const { professionalIds, ...serviceData } = data;
    return this.servicesRepository.create(
      {
        ...serviceData,
        ...(professionalIds &&
          professionalIds.length > 0 && {
            assignments: {
              createMany: {
                data: professionalIds.map((professionalId) => ({ professionalId })),
              },
            },
          }),
        tenant: { connect: { id: tenantId } },
      },
      tx,
    );
  }

  async createMany(data: ServiceCreateManyArgs, tx?: TransactionClient) {
    if (!tx) return this.prisma.$transaction((transaction) => this.createMany(data, transaction));
    const rows = Array.isArray(data.data) ? data.data : [data.data];
    const additions = new Map<string, number>();
    for (const row of rows) additions.set(row.tenantId, (additions.get(row.tenantId) ?? 0) + 1);
    for (const [tenantId, quantity] of additions) await this.tenantUsageService.assertCanAddServices(tenantId, quantity, tx);
    return this.servicesRepository.createMany(data, tx);
  }

  async update(tenantId: string, id: string, data: UpdateServiceDto) {
    const { professionalIds, ...serviceData } = data;
    return this.servicesRepository.update(tenantId, id, {
      ...serviceData,
      ...(professionalIds && {
        assignments: {
          deleteMany: {},
          ...(professionalIds.length > 0 && {
            createMany: {
              data: professionalIds.map((professionalId) => ({ professionalId })),
            },
          }),
        },
      }),
      tenant: { connect: { id: tenantId } },
    });
  }

  async toggleStatus(tenantId: string, id: string) {
    const service = await this.servicesRepository.findById(tenantId, id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return await this.servicesRepository.updateStatus(tenantId, id, !service.isActive);
  }

  async delete(tenantId: string, id: string) {
    return this.servicesRepository.softDelete(tenantId, id);
  }

  async findByIdAndProfessional(tenantId: string, id: string, proefssionalId: string) {
    return this.servicesRepository.findByIdAndProfessional(tenantId, id, proefssionalId);
  }

  async findAllProfessionals(tenantId: string, id: string) {
    return this.servicesRepository.findAllProfessionals(tenantId, id);
  }

  async findAllPublic(tenantId: string) {
    return this.servicesRepository.findAllPublic(tenantId);
  }

  async findAllPublicByProfessional(professionalId: string) {
    return this.servicesRepository.findAllPublicByProfessional(professionalId);
  }
}
