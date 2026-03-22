import { Injectable } from '@nestjs/common';
import { BusinessesRepository } from '../repositories/businesses.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessesRepository) {}

  async findBusinessById(businessId: string) {
    const business = await this.businessesRepository.findById(businessId);
    if (!business) {
      throw new Error('Negocio no encontrado');
    }
    return business;
  }
}
