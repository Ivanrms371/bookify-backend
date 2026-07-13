import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceBulkItemDto, CreateServicesBulkDto } from './dto/create-services-bulk.dto';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BadRequestException } from '@nestjs/common';
import { MediaService } from 'src/shared/media/media.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ServiceCreateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class ServicesService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  async findAllServicesByTenant(tenantId: string) {
    const services = await this.servicesRepository.findManyByTenant(tenantId);
    return services.map((service) => ({
      ...service,
      assignments: service.assignments.map((assignment) => assignment.employeeId),
    }));
  }

  async findManyByIds(ids: string[]) {
    return this.servicesRepository.findManyByIds(ids);
  }

  async findServiceById(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdAndEmployee(id: string, employeeId: string) {
    const service = await this.servicesRepository.findByIdAndEmployee(id, employeeId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async findServiceByIdOnlyTenantId(id: string) {
    const service = await this.servicesRepository.findByIdOnlyTenantId(id);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  private buildServiceCreateInput(
    tenantId: string,
    data: CreateServiceDto,
    options?: { imageUrl?: string; displayOrder?: number },
  ): ServiceCreateInput {
    const { durationMinutes, employeeIds, ...rest } = data;

    return {
      ...rest,
      durationMinutes,
      image: options?.imageUrl,
      displayOrder: options?.displayOrder ?? 0,
      tenant: { connect: { id: tenantId } },
      ...(employeeIds && employeeIds.length > 0
        ? {
            assignments: {
              create: employeeIds.map((employeeId) => ({ employeeId })),
            },
          }
        : {}),
    };
  }

  private handleBulkCreateError(error: unknown): never {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Referencia inválida en los datos del servicio');
      }
    }

    throw new BadRequestException('No se pudieron crear los servicios. Verificá los datos e intentá de nuevo.');
  }

  async createService(tenantId: string, data: CreateServiceDto, files?: { image?: Express.Multer.File[] }) {
    let imageUrl: string | undefined;
    if (files?.image?.[0]) {
      const result = await this.mediaService.upload(files.image[0], 'service', tenantId);
      imageUrl = result.url;
    }

    try {
      const baseOrder = await this.servicesRepository.countByTenant(tenantId);
      return await this.servicesRepository.create(this.buildServiceCreateInput(tenantId, data, { imageUrl, displayOrder: baseOrder }));
    } catch (error) {
      this.handleBulkCreateError(error);
    }
  }

  async updateService(id: string, tenantId: string, data: UpdateServiceDto) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const { durationMinutes, employeeIds, ...rest } = data;

    return await this.servicesRepository.update(id, {
      ...rest,
      durationMinutes,
      ...(employeeIds !== undefined
        ? {
            assignments: {
              deleteMany: {},
              create: employeeIds.map((employeeId) => ({ employeeId })),
            },
          }
        : {}),
    });
  }

  async activateService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: true });
  }

  async deactivateService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { isActive: false });
  }

  async reorderServices(tenantId: string, orders: ReorderServiceDto[]) {}

  async softDeleteService(id: string, tenantId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(id, tenantId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return await this.servicesRepository.update(id, { deletedAt: new Date() });
  }

  async toggleSelfAssignment(serviceId: string, tenantId: string, userId: string) {
    const service = await this.servicesRepository.findByIdAndTenant(serviceId, tenantId);
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const employee = await this.prisma.employee.findFirst({
      where: { tenantId, userId, deletedAt: null },
    });
    if (!employee) throw new BadRequestException('Perfil de employee no encontrado');

    const assignment = await this.prisma.serviceAssignment.findFirst({
      where: { employeeId: employee.id, serviceId },
    });

    if (assignment) {
      await this.prisma.serviceAssignment.delete({
        where: { employeeId_serviceId: { employeeId: employee.id, serviceId } },
      });
      return { assigned: false };
    } else {
      await this.prisma.serviceAssignment.create({
        data: { employeeId: employee.id, serviceId },
      });
      return { assigned: true };
    }
  }

  async updateAssignments(serviceId: string, tenantId: string, employeeIds: string[]) {
    const service = await this.servicesRepository.findByIdAndTenant(serviceId, tenantId);
    if (!service) throw new NotFoundException('Servicio no encontrado');

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        assignments: {
          deleteMany: {},
          create: employeeIds.map((employeeId) => ({ employeeId })),
        },
      },
    });
  }
}
