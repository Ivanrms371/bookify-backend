import { Injectable } from '@nestjs/common';
import { ServiceAssignmentUpdateInput } from 'src/generated/prisma/models';
import { ServiceAssigmentRepository } from '../repositories/service-assigment.repository';

@Injectable()
export class ServiceAssigmentService {
  constructor(private readonly serviceAssigmentRepository: ServiceAssigmentRepository) {}

  findManyByStaff(staffId: string) {
    return this.serviceAssigmentRepository.findManyByStaff(staffId);
  }

  findPublicByStaff(staffId: string) {
    return this.serviceAssigmentRepository.findPublicByStaff(staffId);
  }

  assignTo(serviceId: string, proffesionalId: string) {
    // TODO: check if service is from this business
    // TODO: check if staff is from this business
    return this.serviceAssigmentRepository.assignTo(serviceId, proffesionalId);
  }

  unassignFrom(serviceId: string, proffesionalId: string) {
    // TODO: check if service is from this business
    // TODO: check if staff is from this business
    return this.serviceAssigmentRepository.unassignFrom(serviceId, proffesionalId);
  }

  activate(serviceId: string, proffesionalId: string) {
    return this.serviceAssigmentRepository.activate(serviceId, proffesionalId);
  }

  deactivate(serviceId: string, proffesionalId: string) {
    return this.serviceAssigmentRepository.deactivate(serviceId, proffesionalId);
  }

  update(serviceId: string, proffesionalId: string, data: ServiceAssignmentUpdateInput) {
    return this.serviceAssigmentRepository.update(serviceId, proffesionalId, data);
  }
}
