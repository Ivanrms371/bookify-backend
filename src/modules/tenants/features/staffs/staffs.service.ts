import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StaffsRepository } from './staffs.repository';
import { CreateFromInviteDto } from './dto/create-from-invite.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { StaffQueryParamsDto } from './dto/staff-query.params.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipRole } from 'src/generated/prisma/enums';

@Injectable()
export class StaffsService {
  constructor(
    private readonly staffsRepository: StaffsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validateStaffAndTenant(staffId: string, tenantId: string) {
    const staff = await this.staffsRepository.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Profesional no encontrado');
    }
    if (staff.tenantId !== tenantId) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return staff;
  }

  findAllByTenant(tenantId: string, params?: StaffQueryParamsDto) {
    return this.staffsRepository.findAllByTenant({ tenantId, ...params });
  }

  async findStaffByIdOnlyTenantId(staffId: string) {
    const staff = await this.staffsRepository.findByIdOnlyTenantId(staffId);
    if (!staff) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return staff;
  }

  findByUserIdAndTenantId(userId: string, tenantId: string) {
    return this.staffsRepository.findByUserIdAndTenantId(userId, tenantId);
  }

  async createFromInvite(dto: CreateFromInviteDto, tx: TransactionClient) {
    const existing = await this.staffsRepository.findByUserIdAndTenantId(dto.userId, dto.tenantId);
    if (existing) {
      throw new ConflictException('Ya existe un profesional con ese email en este negocio.');
    }

    const staff = await this.staffsRepository.create(
      {
        tenant: { connect: { id: dto.tenantId } },
        user: { connect: { id: dto.userId } },
        displayName: dto.displayName,
      },
      tx,
    );
    return staff;
  }

  async createOwnerProfile(tenantId: string, userId: string, userName: string, tx?: TransactionClient) {
    return this.staffsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: userId } },
        title: 'Profesional',
        displayName: userName,
      },
      tx,
    );
  }

  async bulkInvite(tenantId: string, data: { invitations: Array<{ email: string; role: string; commission: number | null }> }) {
    if (!data.invitations || !data.invitations.length) return { success: true };

    await this.prisma.$transaction(async (tx) => {
      for (const inv of data.invitations) {
        let user = await tx.user.findUnique({ where: { email: inv.email } });
        if (!user) {
          user = await tx.user.create({
            data: {
              email: inv.email,
              name: inv.email.split('@')[0],
            }
          });
        }

        const roleEnum = inv.role === 'Administrador' ? MembershipRole.ADMIN : MembershipRole.STAFF;
        
        await tx.membership.upsert({
          where: { userId_tenantId: { userId: user.id, tenantId } },
          create: {
            userId: user.id,
            tenantId,
            role: roleEnum,
            status: 'INVITED',
          },
          update: {
            role: roleEnum,
          }
        });

        const existingStaff = await tx.staff.findUnique({
          where: { userId_tenantId: { userId: user.id, tenantId } }
        });

        if (!existingStaff) {
          await tx.staff.create({
            data: {
              user: { connect: { id: user.id } },
              tenant: { connect: { id: tenantId } },
              displayName: user.name,
              commissionPercent: inv.commission !== null ? inv.commission : null,
              title: inv.role
            }
          });
        } else {
          await tx.staff.update({
             where: { id: existingStaff.id },
             data: {
               commissionPercent: inv.commission !== null ? inv.commission : null,
               title: inv.role
             }
          });
        }
      }
    });

    return { success: true };
  }

  update() {}

  deactivate() {}

  activate() {}
}
