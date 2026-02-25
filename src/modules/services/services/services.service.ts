import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  findAllServicesByBusiness(businessId: string) {
    return this.servicesRepository.findManyByBusiness(businessId);
  }

  async findServiceById(id: string) {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdOnlyBusinessId(id: string) {
    const service = await this.servicesRepository.findByIdOnlyBusinessId(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async createService(businessId: string, data: CreateServiceDto) {
    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0 } = data;

    const durationMinutes = initialActiveMinutes + passiveTimeMinutes + finalActiveMinutes;

    return await this.servicesRepository.create({
      ...data,
      business: { connect: { id: businessId } },
      durationMinutes,
    });
  }

  async updateService(id: string, businessId: string, data: UpdateServiceDto) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const { initialActiveMinutes, passiveTimeMinutes = 0, finalActiveMinutes = 0 } = data;
    const durationMinutes = initialActiveMinutes + passiveTimeMinutes + finalActiveMinutes;

    return await this.servicesRepository.update(id, {
      ...data,
      durationMinutes,
    });
  }

  async activateService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: true });
  }

  async deactivateService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: false });
  }

  async reorderServices(businessId: string, orders: ReorderServiceDto[]) {}

  async softDeleteService(id: string, businessId: string) {
    const service = await this.servicesRepository.findByIdAndBusiness(id, businessId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { deletedAt: new Date() });
  }
}
