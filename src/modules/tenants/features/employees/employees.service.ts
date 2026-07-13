import { ConflictException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { CreateFromInviteDto } from './dto/create-from-invite.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { EmployeeQueryParamsDto } from './dto/employee-query.params.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipRole } from 'src/generated/prisma/enums';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MembershipInvitedEvent } from 'src/modules/tenants/events/membership-invited.event';
import { UpdateEmployeeInput } from './types/update-employee.input';
import { CreateEmployeeInput } from './types/create-employee.input';
import { ServiceAssignmentsService } from '../services/service-assigments/service-assignments.service';
import { WorkingHoursService } from './features/working-hours/working-hours.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateEmployeeAndTenant(employeeId: string, tenantId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Profesional no encontrado');
    }
    if (employee.tenantId !== tenantId) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return employee;
  }

  findAllByTenant(tenantId: string, params?: EmployeeQueryParamsDto) {
    return this.employeesRepository.findAllByTenant({ tenantId, ...params });
  }

  async findEmployeeByIdOnlyTenantId(employeeId: string) {
    const employee = await this.employeesRepository.findByIdOnlyTenantId(employeeId);
    if (!employee) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return employee;
  }

  findById(id: string) {
    return this.employeesRepository.findById(id);
  }

  async findByUserAndTenant(userId: string, tenantId: string, tx?: TransactionClient) {
    return this.employeesRepository.findByUserId(userId, tenantId, tx);
  }

  async create(data: CreateEmployeeInput, tx?: TransactionClient) {
    return this.employeesRepository.create(
      {
        user: { connect: { id: data.userId } },
        tenant: { connect: { id: data.tenantId } },
        ...data,
      },
      tx,
    );
  }

  async bulkInvite(tenantId: string, data: { invitations: Array<{ email: string; role: string; commission: number | null }> }) {
    if (!data.invitations || !data.invitations.length) return { success: true };

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');

    const invitedEvents: MembershipInvitedEvent[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const inv of data.invitations) {
        let user = await tx.user.findUnique({ where: { email: inv.email } });
        if (!user) {
          user = await tx.user.create({
            data: {
              email: inv.email,
              name: inv.email.split('@')[0],
            },
          });
        }

        const roleEnum = inv.role === 'Administrador' ? MembershipRole.ADMIN : MembershipRole.EMPLOYEE;
        const invitationToken = randomUUID();

        invitedEvents.push(
          new MembershipInvitedEvent(tenantId, user.id, user.email, invitationToken, inv.role, tenant.name || 'nuestro negocio'),
        );

        await tx.membership.upsert({
          where: { userId_tenantId: { userId: user.id, tenantId } },
          create: {
            userId: user.id,
            tenantId,
            role: roleEnum,
            status: 'INVITED',
            invitationToken,
          },
          update: {
            role: roleEnum,
            invitationToken,
          },
        });

        const existingEmployee = await tx.employee.findUnique({
          where: { userId_tenantId: { userId: user.id, tenantId } },
        });

        if (!existingEmployee) {
          await tx.employee.create({
            data: {
              user: { connect: { id: user.id } },
              tenant: { connect: { id: tenantId } },
              displayName: user.name,
              commissionPercent: inv.commission !== null ? inv.commission : null,
              title: inv.role,
            },
          });
        } else {
          await tx.employee.update({
            where: { id: existingEmployee.id },
            data: {
              commissionPercent: inv.commission !== null ? inv.commission : null,
              title: inv.role,
            },
          });
        }
      }
    });

    for (const event of invitedEvents) {
      this.eventEmitter.emit('membership.invited', event);
    }

    return { success: true };
  }

  async update(employeeId: string, data: UpdateEmployeeInput, tx?: TransactionClient) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return this.employeesRepository.update(employeeId, data, tx);
  }

  deactivate() {}

  activate() {}
}
