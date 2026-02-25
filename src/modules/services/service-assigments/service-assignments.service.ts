import { ForbiddenException, Injectable } from '@nestjs/common';
import { ServiceAssignmentsRepository } from './service-assignments.repository';
import { ServicesService } from '../services/services.service';
import { StaffsService } from '../../staffs/staffs.service';
import { BusinessStaffParamsDto } from './dto/params/business-staff.params.dto';
import { BusinessStaffServiceParamsDto } from './dto/params/business-staff-service.params.dto';
import { UpdateServiceAssigmentDto } from './dto/body/update-service-assignment.dto';
import { mapServiceAssignmentsToPublic } from './mappers/service-assignment.mapper';
import { ServiceAssignmentWithService } from './mappers/service-assignment.types';

@Injectable()
export class ServiceAssignmentsService {
  constructor(
    private readonly serviceAssignmentsRepository: ServiceAssignmentsRepository,
    private readonly servicesService: ServicesService,
    private readonly staffsService: StaffsService,
  ) {}

  async findManyByStaff(params: BusinessStaffParamsDto) {
    return await this.serviceAssignmentsRepository.findManyByStaff(params.staffId);
  }

  async findPublicByStaff(params: BusinessStaffParamsDto) {
    const assignments = await this.serviceAssignmentsRepository.findManyByStaff(params.staffId);
    return mapServiceAssignmentsToPublic(assignments as ServiceAssignmentWithService[]);
  }

  async assignTo(params: BusinessStaffServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyBusinessId(params.serviceId);
    if (service.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyBusinessId(params.staffId);
    if (staff.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }

    return this.serviceAssignmentsRepository.assignTo(params.serviceId, params.staffId);
  }

  async unassignFrom(params: BusinessStaffServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyBusinessId(params.serviceId);
    if (service.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyBusinessId(params.staffId);
    if (staff.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.unassignFrom(params.serviceId, params.staffId);
  }

  async update(params: BusinessStaffServiceParamsDto, dto: UpdateServiceAssigmentDto) {
    const service = await this.servicesService.findServiceByIdOnlyBusinessId(params.serviceId);
    if (service.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyBusinessId(params.staffId);
    if (staff.businessId !== params.businessId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.update(params.serviceId, params.staffId, dto);
  }
}
