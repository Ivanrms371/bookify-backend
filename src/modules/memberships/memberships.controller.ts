import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  async findAll(@GetTenantId() tenantId: string) {
    return this.membershipsService.findAll(tenantId);
  }

  async create(@GetTenantId() tenantId: string, @Body() body: any) {
    return this.membershipsService.create(tenantId, body.userId, body.role);
  }

  @Put(':id')
  async update(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.membershipsService.update(tenantId, id, body);
  }

  @Delete(':id')
  async delete(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.membershipsService.delete(tenantId, id);
  }
}
