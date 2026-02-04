import { Injectable } from '@nestjs/common';
import { StaffRepository } from './staff.repository';

@Injectable()
export class StaffService {
  constructor(private readonly staffRepository: StaffRepository) {}

  findManyByBusiness(businessId: string) {
    return this.staffRepository.findManyByBusiness(businessId);
  }

  findPublicByBusiness(businessId: string) {
    return this.staffRepository.findPublicByBusiness(businessId);
  }

  findById(id: string) {
    return this.staffRepository.findById(id);
  }

  findByUserIdAndBusinessId(userId: string, businessId: string) {
    return this.staffRepository.findByUserIdAndBusinessId(userId, businessId);
  }

  findExistingMember(email: string, businessId: string) {
    return this.staffRepository.findExistingMember(email, businessId);
  }

  createFromInvite(inviteId: string) {}

  update() {}

  deactivate() {}

  activate() {}
}
