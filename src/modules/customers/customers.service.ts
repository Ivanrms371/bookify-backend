import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindAllCustomersParams } from './dto/find-all-customers-params.dto';
import { CustomerNotFoundException, CustomerPhoneAlreadyExistsException } from './exceptions/customer.exceptions';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findAll(tenantId: string, params: FindAllCustomersParams) {
    return await this.customersRepository.findMany({
      tenantId,
      ...params,
    });
  }

  async findById(tenantId: string, id: string) {
    return this.customersRepository.findById(tenantId, id);
  }

  async search(tenantId: string, query: string) {
    return this.customersRepository.search(tenantId, query);
  }

  async upsert(tenantId: string, data: CreateCustomerDto) {
    const phoneExists = await this.customersRepository.findByPhone(tenantId, data.phoneCountryCode, data.phone);

    if (phoneExists && !phoneExists.deletedAt) {
      throw new CustomerPhoneAlreadyExistsException();
    }
    return this.customersRepository.upsert(tenantId, data);
  }

  async update(tenantId: string, id: string, data: UpdateCustomerDto) {
    const customer = await this.customersRepository.findById(tenantId, id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    if (data.phone && data.phoneCountryCode) {
      const phoneExists = await this.customersRepository.findByPhone(
        tenantId,
        data.phoneCountryCode || customer.phoneCountryCode,
        data.phone || customer.phone,
      );
      if (phoneExists && phoneExists.id !== id && !phoneExists.deletedAt) {
        throw new CustomerPhoneAlreadyExistsException();
      }
    }
    return this.customersRepository.update(tenantId, id, data);
  }

  async block(tenantId: string, id: string) {
    const customer = await this.customersRepository.findById(tenantId, id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    return this.customersRepository.block(tenantId, id);
  }

  async unblock(tenantId: string, id: string) {
    const customer = await this.customersRepository.findById(tenantId, id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    return this.customersRepository.unblock(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    return this.customersRepository.softDelete(tenantId, id);
  }
}
