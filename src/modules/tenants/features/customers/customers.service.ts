import { Injectable } from "@nestjs/common"
import { CustomersRepository } from "./customers.repository"
import { CreateCustomerDto } from "./dto/create-customer.dto"
import { UpdateCustomerDto } from "./dto/update-customer.dto"
import { CustomersQueryDto } from "./dto/customers-query.dto"
import { UpdateCustomerNotesDto } from "./dto/update-customer-notes.dto"

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findAll(tenantId: string, params: CustomersQueryDto) {
    return this.customersRepository.findAll({
      tenantId,
      ...params,
    })
  }

  async findById(id: string) {
    return this.customersRepository.findById(id)
  }

  async findOrCreate(tenantId: string, data: CreateCustomerDto) {
    const customer = await this.customersRepository.findByPhone(tenantId, data.phone)
    if (customer) {
      return { customer, isNewCustomer: false }
    }
    const newCustomer = await this.create(tenantId, data)
    return { customer: newCustomer, isNewCustomer: true }
  }

  async create(tenantId: string, data: CreateCustomerDto) {
    return this.customersRepository.create({
      ...data,
      tenantId,
    } as any)
  }

  async update(tenantId: string, id: string, data: UpdateCustomerDto) {
    return this.customersRepository.update(id, data)
  }

  async updateNotes(
    tenantId: string,
    id: string,
    data: UpdateCustomerNotesDto,
  ) {
    return this.customersRepository.update(id, {
      notes: data.notes,
    })
  }

  async block(tenantId: string, id: string) {
    return this.customersRepository.block(id)
  }

  async unblock(tenantId: string, id: string) {
    return this.customersRepository.unblock(id)
  }

  async delete(tenantId: string, id: string) {
    return this.customersRepository.softDelete(id)
  }
}
