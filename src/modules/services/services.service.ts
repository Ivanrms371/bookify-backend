import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { GetServicesQueryDto } from './dto/get-services-query.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

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

  async create(tenantId: string, data: CreateServiceDto) {
    const { professionalIds, ...serviceData } = data;
    return this.servicesRepository.create({
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
    });
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

  async findAllProfessionals(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.servicesRepository.findAllProfessionals(tenantId, id);
  }
}
