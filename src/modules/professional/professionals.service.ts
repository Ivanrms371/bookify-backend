import { Injectable, NotFoundException } from '@nestjs/common';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import { ProfessionalsRepository } from './professionals.repository';
import { AddServiceDto } from './dto/add-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly professionalsRepository: ProfessionalsRepository) {}

  async findAll(tenantId: string, query: GetProfessionalsQueryDto) {
    const professionals = await this.professionalsRepository.findMany(tenantId, query);
    return professionals.map(prof => ({
      id: prof.id,
      avatarUrl: prof.avatarUrl,
      displayName: prof.displayName,
      colorTheme: (prof as any).colorTheme ?? null,
      bio: (prof as any).bio ?? null,
      email: prof.user?.email || null,
      phone: prof.user?.phone || null,
    }));
  }

  async findEntityOrFail(tenantId: string, professionalId: string) {
    const professional = await this.findById(tenantId, professionalId);
    if (!professional) {
      throw new NotFoundException('Empleado no encontrado');
    }
    return professional;
  }

  async findById(tenantId: string, id: string) {
    return this.professionalsRepository.findById(tenantId, id);
  }

  // async create(tenantId: string, data: CreateProfessionalDto) {
  //   return this.professionalsRepository.create(data);
  // }

  // async update(tenantId: string, id: string, data: UpdateProfessionalDto) {
  //   return this.professionalsRepository.update(tenantId, id, data);
  // }

  async delete(tenantId: string, id: string) {
    return this.professionalsRepository.softDelete(tenantId, id);
  }

  async addService(dto: AddServiceDto) {
    // check if both exists
    return this.professionalsRepository.addService(dto.professionalId, dto.serviceId);
  }

  async removeService(dto: RemoveServiceDto) {
    return this.professionalsRepository.removeService(dto.professionalId, dto.serviceId);
  }
}
