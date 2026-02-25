import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findOrCreateCustomer(businessId: string, customer: CreateCustomerDto) {
    const existing = await this.customersRepository.findByPhone(businessId, customer.phone);
    if (existing) return existing;

    return this.customersRepository.create({
      ...customer,
      firstAppointmentAt: new Date(),
      lastAppointmentAt: new Date(),
      business: { connect: { id: businessId } },
    });
  }

  async findById(id: string) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado`);
    }
    return customer;
  }
}
