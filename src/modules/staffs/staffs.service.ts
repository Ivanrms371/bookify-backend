import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StaffsRepository } from './staffs.repository';
import { CreateFromInviteDto } from './dto/create-from-invite.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { StaffStatsService } from './features/stats/staff-stats.service';

@Injectable()
export class StaffsService {
  constructor(
    private readonly staffsRepository: StaffsRepository,
    private readonly staffStatsService: StaffStatsService,
  ) {}

  async validateStaffAndBusiness(staffId: string, businessId: string) {
    const staff = await this.staffsRepository.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Profesional no encontrado');
    }
    if (staff.businessId !== businessId) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return staff;
  }

  async findByEmailAndBusinessId(email: string, businessId: string) {
    return this.staffsRepository.findByEmailAndBusinessId(email, businessId);
  }

  findManyByBusiness(businessId: string) {
    return this.staffsRepository.findManyByBusiness(businessId);
  }

  findPublicByBusiness(businessId: string) {
    return this.staffsRepository.findPublicByBusiness(businessId);
  }

  async findStaffById(id: string) {
    const staff = await this.staffsRepository.findById(id);
    if (!staff) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return staff;
  }

  async findStaffByIdOnlyBusinessId(staffId: string) {
    const staff = await this.staffsRepository.findByIdOnlyBusinessId(staffId);
    if (!staff) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return staff;
  }

  findByUserIdAndBusinessId(userId: string, businessId: string) {
    return this.staffsRepository.findByUserIdAndBusinessId(userId, businessId);
  }

  findExistingMember(email: string, businessId: string) {
    return this.staffsRepository.findExistingMemberByEmail(email, businessId);
  }

  async createFromInvite(dto: CreateFromInviteDto, tx: TransactionClient) {
    const existing = await this.staffsRepository.findExistingMemberByUserId(dto.userId, dto.businessId);
    if (existing) {
      throw new ConflictException('Ya existe un profesional con ese email en este negocio.');
    }

    const staff = await this.staffsRepository.create(
      {
        business: { connect: { id: dto.businessId } },
        user: { connect: { id: dto.userId } },
        displayName: dto.displayName,
      },
      tx,
    );
    return staff;
  }

  update() {}

  deactivate() {}

  activate() {}
}
