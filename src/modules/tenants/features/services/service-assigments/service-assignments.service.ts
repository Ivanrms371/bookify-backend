import { ForbiddenException, Injectable } from '@nestjs/common';
import { ServiceAssignmentsRepository } from './service-assignments.repository';
import { ServicesService } from '../services/services.service';
import { StaffsService } from '../../staffs/staffs.service';
import { TenantStaffParamsDto } from './dto/params/tenant-staff.params.dto';
import { TenantStaffServiceParamsDto } from './dto/params/tenant-staff-service.params.dto';
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

  async findManyByStaff(params: TenantStaffParamsDto) {
    return await this.serviceAssignmentsRepository.findManyByStaff(params.staffId);
  }

  async findPublicByStaff(params: TenantStaffParamsDto) {
    const assignments = await this.serviceAssignmentsRepository.findManyByStaff(params.staffId);
    return mapServiceAssignmentsToPublic(assignments as ServiceAssignmentWithService[]);
  }

  async assignTo(params: TenantStaffServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyTenantId(params.staffId);
    if (staff.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }

    return this.serviceAssignmentsRepository.assignTo(params.serviceId, params.staffId);
  }

  async unassignFrom(params: TenantStaffServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyTenantId(params.staffId);
    if (staff.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.unassignFrom(params.serviceId, params.staffId);
  }

  async update(params: TenantStaffServiceParamsDto, dto: UpdateServiceAssigmentDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const staff = await this.staffsService.findStaffByIdOnlyTenantId(params.staffId);
    if (staff.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.update(params.serviceId, params.staffId, dto);
  }
}
