import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipsRepository } from './memberships.repository';
import { MembershipRole, MembershipStatus } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { EmployeesService } from '../employees/employees.service';
import { AcceptInviteInput } from './types/accept-invite.input';
import { AcceptInviteParams } from './types/accept-invite.params';
import { UsersService } from 'src/modules/users/users.service';
import { WorkingHoursService } from '../employees/features/working-hours/working-hours.service';
import { ServiceAssignmentsService } from '../services/service-assigments/service-assignments.service';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsRepository: MembershipsRepository,
    private readonly usersService: UsersService,
    private readonly employeesService: EmployeesService,
    private readonly workingHoursService: WorkingHoursService,
    private readonly serviceAssignmentsService: ServiceAssignmentsService,
  ) {}

  async createOwner(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.membershipsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: userId } },
        role: MembershipRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
      tx,
    );
  }

  async addMember(tenantId: string, userId: string, role: MembershipRole, tx?: TransactionClient) {
    const existing = await this.membershipsRepository.findByUserAndTenant(userId, tenantId, tx);
    if (existing) {
      throw new ConflictException('Este usuario ya pertenece al negocio');
    }
  }

  async findByUserAndTenant(userId: string, tenantId: string, tx?: TransactionClient) {
    const member = await this.membershipsRepository.findByUserAndTenant(userId, tenantId, tx);
    if (!member) {
      throw new NotFoundException('No hemos encontrado el negocio');
    }
    return member;
  }

  async validateInvite(token: string) {
    if (!token) throw new NotFoundException('Token es requerido');

    const membership = await this.membershipsRepository.findByToken(token);
    if (!membership || membership.status !== MembershipStatus.INVITED) {
      throw new NotFoundException('Invitación inválida o expirada');
    }

    const canAdd = true;
    if (!canAdd) {
      throw new ConflictException('El límite de profesionales para este negocio ha sido alcanzado. Contacte al propietario.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: membership.tenantId },
      select: {
        name: true,
        services: {
          where: { isActive: true },
          select: { id: true, name: true, durationMinutes: true, price: true },
        },
        tenantWorkingHours: {
          select: {
            dayOfWeek: true,
            opensAt: true,
            closesAt: true,
          },
        },
      },
    });

    return {
      tenantName: tenant?.name,
      email: membership.user.email,
      services: tenant?.services,
      tenantWorkingHours: tenant?.tenantWorkingHours,
    };
  }

  async acceptInvite(dto: AcceptInviteInput, params: AcceptInviteParams) {
    const membership = await this.membershipsRepository.findByToken(params.token);
    if (!membership || membership.status !== MembershipStatus.INVITED) {
      throw new NotFoundException('Invitación inválida o expirada');
    }

    const canAdd = true;
    if (!canAdd) {
      throw new ConflictException('No se pueden agregar más profesionales debido a los límites del plan.');
    }

    const { userId, tenantId, role } = membership;

    await this.prisma.$transaction(async (tx) => {
      await this.usersService.update(userId, { name: dto.name, phone: dto.phone }, tx);
      const hashed = await bcrypt.hash(dto.password, 10);
      await this.usersService.updatePassword(userId, hashed, tx);

      await this.membershipsRepository.acceptedInvite(membership.id, tx);

      let employee = await this.employeesService.findByUserAndTenant(userId, tenantId, tx);
      if (!employee) {
        employee = await this.employeesService.create(
          {
            userId,
            tenantId,
            displayName: dto.name,
            title: 'Profesional',
          },
          tx,
        );
      } else {
        employee = await this.employeesService.update(
          employee.id,
          {
            displayName: dto.name,
          },
          tx,
        );
      }

      if (dto.workingHours) {
        await this.workingHoursService.assignWorkingHours(employee.id, tenantId, dto.workingHours, tx);
      }

      if (dto.serviceIds) {
        await this.serviceAssignmentsService.assignServices(employee.id, dto.serviceIds, tx);
      }
    });

    return { success: true };
  }
}
