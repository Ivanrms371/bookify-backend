import { Injectable } from '@nestjs/common';
import { ServiceRepository } from '../repositories/service.repository';
import { ServiceAssigmentRepository } from '../repositories/service-assigment.repository';
import { CreateServiceDto } from '../dto/create-service.dto';
import { ReorderServiceDto } from '../dto/reoder-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServiceManagementService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly serviceAssigmentRepository: ServiceAssigmentRepository,
  ) {}

  findAllByBusiness(businessId: string) {
    return this.serviceRepository.findManyByBusiness(businessId);
  }

  findManyByStaff(staffId: string) {
    return this.serviceAssigmentRepository.findManyByStaff(staffId);
  }

  findById(id: string) {
    return this.serviceRepository.findById(id);
  }

  create(businessId: string, data: CreateServiceDto) {}

  update(id: string, data: UpdateServiceDto) {}

  activate(id: string) {}

  deactivate(id: string) {}

  reorder(businessId: string, orders: ReorderServiceDto[]) {}

  softDelete(id: string) {}
}
