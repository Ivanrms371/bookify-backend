import { ForbiddenException, Injectable } from '@nestjs/common';
import { ServiceAssignmentsRepository } from './service-assignments.repository';
import { ServicesService } from '../services/services.service';
import { EmployeesService } from '../../employees/employees.service';
import { TenantEmployeeParamsDto } from './dto/params/tenant-employee.params.dto';
import { TenantEmployeeServiceParamsDto } from './dto/params/tenant-employee-service.params.dto';
import { UpdateServiceAssigmentDto } from './dto/body/update-service-assignment.dto';
import { mapServiceAssignmentsToPublic } from './mappers/service-assignment.mapper';
import { ServiceAssignmentWithService } from './mappers/service-assignment.types';

@Injectable()
export class ServiceAssignmentsService {
  constructor(
    private readonly serviceAssignmentsRepository: ServiceAssignmentsRepository,
    private readonly servicesService: ServicesService,
    private readonly employeesService: EmployeesService,
  ) {}

  async findManyByEmployee(params: TenantEmployeeParamsDto) {
    return await this.serviceAssignmentsRepository.findManyByEmployee(params.employeeId);
  }

  async findPublicByEmployee(params: TenantEmployeeParamsDto) {
    const assignments = await this.serviceAssignmentsRepository.findManyByEmployee(params.employeeId);
    return mapServiceAssignmentsToPublic(assignments as ServiceAssignmentWithService[]);
  }

  async assignTo(params: TenantEmployeeServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const employee = await this.employeesService.findEmployeeByIdOnlyTenantId(params.employeeId);
    if (employee.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }

    return this.serviceAssignmentsRepository.assignTo(params.serviceId, params.employeeId);
  }

  async unassignFrom(params: TenantEmployeeServiceParamsDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const employee = await this.employeesService.findEmployeeByIdOnlyTenantId(params.employeeId);
    if (employee.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.unassignFrom(params.serviceId, params.employeeId);
  }

  async update(params: TenantEmployeeServiceParamsDto, dto: UpdateServiceAssigmentDto) {
    const service = await this.servicesService.findServiceByIdOnlyTenantId(params.serviceId);
    if (service.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    const employee = await this.employeesService.findEmployeeByIdOnlyTenantId(params.employeeId);
    if (employee.tenantId !== params.tenantId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion');
    }
    return this.serviceAssignmentsRepository.update(params.serviceId, params.employeeId, dto);
  }

  async assignServices(employeeId: string, serviceIds: string[], tx?: any) {
    if (!serviceIds || serviceIds.length === 0) return;

    await this.serviceAssignmentsRepository.deleteByEmployeeId(employeeId, tx);

    const data = serviceIds.map((serviceId) => ({
      employeeId,
      serviceId,
      isActive: true,
    }));

    await this.serviceAssignmentsRepository.createMany(data, tx);
  }
}
