import { Injectable, NotFoundException } from '@nestjs/common';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import { ProfessionalsRepository } from './professionals.repository';
import { AddServiceDto } from './dto/add-service.dto';
import { RemoveServiceDto } from './dto/remove-service.dto';
import { ProfessionalsMapper } from './professionals.mapper';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { DAY_OF_WEEK_TO_INT } from 'src/common/constants/day-of-week.constants';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { ServiceAssignmentCreateManyInput } from 'src/generated/prisma/models';
import { ProfessionalWorkingHoursService } from './features/working-hours/working-hours.service';
import { MembershipRole } from 'src/generated/prisma/enums';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly professionalsRepository: ProfessionalsRepository,
    private readonly membershipService: MembershipsService,
    private readonly workingHoursService: ProfessionalWorkingHoursService,
  ) {}

  async findAll(tenantId: string, query: GetProfessionalsQueryDto) {
    const professionals = await this.professionalsRepository.findMany(tenantId, query);
    return professionals.map((prof) => ({
      id: prof.id,
      avatarUrl: prof.avatarUrl,
      displayName: prof.displayName,
      colorTheme: (prof as any).colorTheme ?? null,
      bio: (prof as any).bio ?? null,
      email: prof.user?.email || null,
      phone: prof.user?.phone || null,
      phoneCountryCode: prof.user?.phoneCountryCode || null,
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

  async getByIdWithDetails(tenantId: string, id: string) {
    const prof = await this.professionalsRepository.findByIdWithDetails(tenantId, id);
    if (!prof) {
      throw new NotFoundException('Profesional no encontrado');
    }

    return ProfessionalsMapper.toDetailsDto(prof);
  }

  async update(tenantId: string, id: string, dto: UpdateProfessionalDto) {
    const professional = await this.professionalsRepository.findById(tenantId, id);
    if (!professional) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const {
      displayName,
      phone,
      phoneCountryCode,
      avatarUrl,
      avatarPublicId,
      bio,
      commissionType,
      commissionAmount,
      maxAdvancedDays,
      minAdvancedMinutes,
      slotIntervalMinutes,
      role,
      schedule,
      serviceIds,
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      await this.professionalsRepository.update(
        tenantId,
        id,
        {
          displayName,
          avatarUrl,
          avatarPublicId,
          bio,
          commissionType,
          commissionAmount,
          maxAdvancedDays,
          minAdvancedMinutes,
          slotIntervalMinutes,
        },
        tx,
      );
      if (phone !== undefined || phoneCountryCode !== undefined) {
        await tx.user.update({
          where: { id: professional.userId },
          data: {
            ...(phone !== undefined && { phone }),
            ...(phoneCountryCode !== undefined && { phoneCountryCode }),
          },
        });
      }

      if (role) {
        const membership = await this.membershipService.findByUserId(tenantId, professional.userId, tx);
        if (!membership) {
          throw new NotFoundException('Un error ha ocurrido al actualizar');
        }
        if (membership.role !== MembershipRole.OWNER) {
          await this.membershipService.update(tenantId, membership?.id, { role }, tx);
        }
      }
      if (serviceIds) {
        const servicesData: ServiceAssignmentCreateManyInput[] = serviceIds.map((serviceId) => ({
          professionalId: id,
          serviceId,
          isActive: true,
        }));
        await this.professionalsRepository.replaceServices(professional.id, servicesData, tx);
      }
      if (schedule?.workingHours) {
        await this.workingHoursService.replaceAll(tenantId, professional.id, schedule, tx);
      }
    });

    return { success: true };
  }

  async delete(tenantId: string, id: string) {
    return this.professionalsRepository.softDelete(tenantId, id);
  }

  async addService(dto: AddServiceDto) {
    return this.professionalsRepository.addService(dto.professionalId, dto.serviceId);
  }

  async removeService(dto: RemoveServiceDto) {
    return this.professionalsRepository.removeService(dto.professionalId, dto.serviceId);
  }
}
