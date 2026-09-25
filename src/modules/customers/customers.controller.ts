import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Put } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { FindAllCustomersParams } from './dto/find-all-customers-params.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Permissions(PERMISSIONS.CUSTOMER_READ)
  @Get()
  async findAll(@GetTenantId() tenantId: string, @Query() params: FindAllCustomersParams) {
    return this.customersService.findAll(tenantId, params);
  }

  @Permissions(PERMISSIONS.CUSTOMER_READ)
  @Get('search')
  async search(@GetTenantId() tenantId: string, @Query('query') query: string) {
    return this.customersService.search(tenantId, query);
  }

  @Permissions(PERMISSIONS.CUSTOMER_READ)
  @Get(':id')
  async findById(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findById(tenantId, id);
  }

  @Permissions(PERMISSIONS.CUSTOMER_CREATE)
  @Post()
  async create(@GetTenantId() tenantId: string, @Body() data: CreateCustomerDto) {
    return this.customersService.create(tenantId, data);
  }

  @Permissions(PERMISSIONS.CUSTOMER_UPDATE)
  @Put(':id')
  async update(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateCustomerDto) {
    return this.customersService.update(tenantId, id, data);
  }

  @Permissions(PERMISSIONS.CUSTOMER_BLOCK)
  @Patch(':id/block')
  async block(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.block(tenantId, id);
  }

  @Permissions(PERMISSIONS.CUSTOMER_BLOCK)
  @Patch(':id/unblock')
  async unblock(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.unblock(tenantId, id);
  }

  @Permissions(PERMISSIONS.CUSTOMER_DELETE)
  @Delete(':id')
  async delete(@GetTenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.delete(tenantId, id);
  }
}
