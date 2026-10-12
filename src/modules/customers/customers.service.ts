import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindAllCustomersParams } from './dto/find-all-customers-params.dto';
import { CustomerInvalidPhoneException, CustomerNotFoundException, CustomerPhoneAlreadyExistsException } from './exceptions/customer.exceptions';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

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

  async findByIdGlobal(id: string) {
    return this.customersRepository.findByIdGlobal(id);
  }

  async findByPhoneOrCreate(tenantId: string, data: CreateCustomerDto, tx?: TransactionClient) {
    const exists = await this.customersRepository.findByPhone(tenantId, data.phoneCountryCode, data.phoneNumber, tx);
    if (exists) {
      const updated = await this.customersRepository.update(tenantId, exists.id, data, tx);
      return { ...updated, isNew: false };
    }
    const newCustomer = await this.customersRepository.create({ tenant: { connect: { id: tenantId } }, ...data }, tx);
    return { ...newCustomer, isNew: true };
  }

  async findPublicByPhoneOrCreate(tenantId: string, data: CreateCustomerDto) {
    const phoneCountryCode = data.phoneCountryCode.replace(/\D/g, '');
    const phoneNumber = data.phoneNumber.replace(/\D/g, '');
    if (!phoneCountryCode || !phoneNumber || (phoneCountryCode + phoneNumber).length > 15) {
      throw new CustomerInvalidPhoneException();
    }
    return this.customersRepository.findOrCreatePublic(tenantId, { ...data, phoneCountryCode, phoneNumber });
  }

  async search(tenantId: string, query: string) {
    return this.customersRepository.search(tenantId, query);
  }

  async create(tenantId: string, data: CreateCustomerDto) {
    const phoneExists = await this.customersRepository.findByPhone(tenantId, data.phoneCountryCode, data.phoneNumber);
    if (phoneExists && !phoneExists.deletedAt) {
      throw new CustomerPhoneAlreadyExistsException();
    }
    return this.customersRepository.create({ tenant: { connect: { id: tenantId } }, ...data });
  }

  async update(tenantId: string, id: string, data: UpdateCustomerDto) {
    const customer = await this.customersRepository.findById(tenantId, id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    if (data.phoneNumber !== undefined || data.phoneCountryCode !== undefined) {
      const phoneExists = await this.customersRepository.findByPhone(
        tenantId,
        data.phoneCountryCode || customer.phoneCountryCode,
        data.phoneNumber || customer.phoneNumber,
      );
      if (phoneExists && phoneExists.id !== id && !phoneExists.deletedAt) {
        throw new CustomerPhoneAlreadyExistsException();
      }
    }
    return this.customersRepository.updateContacts(tenantId, id, data);
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

  async markPhoneAsVerified(id: string, tx?: TransactionClient) {
    return this.customersRepository.markPhoneAsVerified(id, tx);
  }

  async markEmailAsVerified(id: string, tx?: TransactionClient) {
    return this.customersRepository.markEmailAsVerified(id, tx);
  }
}
