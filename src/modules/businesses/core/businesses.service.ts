import { Injectable } from '@nestjs/common';
import { BusinessesRepository } from './businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessesRepository) {}

  async findBusinessById(businessId: string) {
    const business = await this.businessesRepository.findById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    return business;
  }
}
