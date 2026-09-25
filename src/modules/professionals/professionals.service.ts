import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import { ProfessionalsRepository } from './professionals.repository';
import { AddServiceDto } from './dto/add-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';
import { ProfessionalsMapper } from './professionals.mapper';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { ServiceAssignmentCreateManyInput } from 'src/generated/prisma/models';
import { ProfessionalWorkingHoursService } from './features/working-hours/working-hours.service';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { MembershipRole } from 'src/generated/prisma/enums';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly professionalsRepository: ProfessionalsRepository,
    private readonly workingHoursService: ProfessionalWorkingHoursService,
  ) {}

  async findAll(tenantId: string, query: GetProfessionalsQueryDto) {
    const professionals = await this.professionalsRepository.findMany(tenantId, query);
    return professionals.map((prof) => ({
      id: prof.id,
      avatarUrl: prof.avatarUrl,
      name: prof.name,
      colorTheme: (prof as any).colorTheme ?? null,
      bio: (prof as any).bio ?? null,
      email: prof.user?.email || null,
      phoneNumber: prof.user?.phoneNumber || null,
      phoneCountryCode: prof.user?.phoneCountryCode || null,
    }));
  }

  async findById(tenantId: string, id: string, tx?: TransactionClient) {
    const professional = await this.professionalsRepository.findById(tenantId, id, tx);
    return professional;
  }

  async getByIdWithDetails(tenantId: string, id: string) {
    const prof = await this.professionalsRepository.findByIdWithDetails(tenantId, id);
    if (!prof) {
      throw new NotFoundException('Profesional no encontrado');
    }

    return ProfessionalsMapper.toDetailsDto(prof);
  }

  async create(tenantId: string, dto: CreateProfessionalDto, tx?: TransactionClient) {
    const professional = await this.professionalsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        phoneCountryCode: dto.phoneCountryCode,
        profession: dto.profession,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        avatarPublicId: dto.avatarPublicId,
      },
      tx,
    );

    if (dto.serviceIds && dto.serviceIds.length > 0) {
      const servicesData = dto.serviceIds.map((serviceId) => ({
        professionalId: professional.id,
        serviceId,
        isActive: true,
      }));
      await this.professionalsRepository.replaceServices(professional.id, servicesData, tx);
    }

    return professional;
  }

  async update(tenantId: string, id: string, dto: UpdateProfessionalDto, externalTx?: TransactionClient) {
    const professional = await this.professionalsRepository.findById(tenantId, id);
    if (!professional) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const { name, phoneNumber, phoneCountryCode, avatarUrl, avatarPublicId, bio, serviceIds, giveAccess } = dto;

    const executeUpdate = async (tx: TransactionClient) => {
      await this.professionalsRepository.update(
        tenantId,
        id,
        {
          name,
          phoneNumber,
          phoneCountryCode,
          avatarUrl,
          avatarPublicId,
          bio,
          ...(giveAccess && professional.userId && { user: { disconnect: { id } } }),
        },
        tx,
      );
      if (serviceIds) {
        const servicesData: ServiceAssignmentCreateManyInput[] = serviceIds.map((serviceId) => ({
          professionalId: id,
          serviceId,
          isActive: true,
        }));
        await this.professionalsRepository.replaceServices(professional.id, servicesData, tx);
      }
    };

    if (externalTx) {
      await executeUpdate(externalTx);
    } else {
      await this.prisma.$transaction(executeUpdate);
    }

    return { success: true };
  }

  async updateProfileByUser(tenantId: string, userId: string, dto: UpdateProfessionalProfileDto) {
    const professional = await this.professionalsRepository.findByUserId(tenantId, userId);
    if (!professional) {
      throw new NotFoundException('Perfil profesional no encontrado para este usuario');
    }

    const { name, phoneNumber, phoneCountryCode, avatarUrl, avatarPublicId, bio, profession, colorTheme } = dto;

    return this.professionalsRepository.update(tenantId, professional.id, {
      name,
      phoneNumber,
      phoneCountryCode,
      avatarUrl,
      avatarPublicId,
      bio,
      profession,
      colorTheme,
    });
  }

  async linkToUser(tenantId: string, id: string, userId: string, tx?: TransactionClient) {
    return this.professionalsRepository.update(tenantId, id, { user: { connect: { id: userId } } }, tx);
  }

  async unlinkFromUser(tenantId: string, id: string, userId: string, tx?: TransactionClient) {
    return this.professionalsRepository.update(tenantId, id, { user: { disconnect: { id: userId } } }, tx);
  }

  async delete(tenantId: string, id: string, tx?: TransactionClient) {
    return this.professionalsRepository.softDelete(tenantId, id, tx);
  }

  async addService(dto: AddServiceDto) {
    return this.professionalsRepository.addService(dto.professionalId, dto.serviceId);
  }

  async removeService(dto: RemoveServiceDto) {
    return this.professionalsRepository.removeService(dto.professionalId, dto.serviceId);
  }

  async findAllPublic(tenantId: string) {
    return this.professionalsRepository.findAllPublic(tenantId);
  }

  async findAllPublicByService(serviceId: string) {
    return this.professionalsRepository.findAllPublicByService(serviceId);
  }
}
