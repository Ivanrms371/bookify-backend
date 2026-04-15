import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Put,
} from "@nestjs/common"
import { CustomersService } from "./customers.service"
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard"
import { TenantGuard } from "src/common/guards/tenant.guard"
import { CustomersQueryDto } from "./dto/customers-query.dto"
import { CreateCustomerDto } from "./dto/create-customer.dto"
import { UpdateCustomerDto } from "./dto/update-customer.dto"

import { UpdateCustomerNotesDto } from "./dto/update-customer-notes.dto"

@Controller("tenants/:tenantId/customers")
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Query() params: CustomersQueryDto,
  ) {
    return this.customersService.findAll(tenantId, params)
  }

  @Get(":id")
  async findOne(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findById(id)
  }

  @Post()
  async create(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Body() data: CreateCustomerDto,
  ) {
    return this.customersService.create(tenantId, data)
  }

  @Put(":id")
  async update(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateCustomerDto,
  ) {
    return this.customersService.update(tenantId, id, data)
  }

  @Patch(":id/notes")
  async updateNotes(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() data: UpdateCustomerNotesDto,
  ) {
    return "Hello Notes"
  }

  @Patch(":id/block")
  async block(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.customersService.block(tenantId, id)
  }

  @Patch(":id/unblock")
  async unblock(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.customersService.unblock(tenantId, id)
  }

  @Delete(":id")
  async delete(
    @Param("tenantId", ParseUUIDPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.customersService.delete(tenantId, id)
  }
}
