import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  async findAll(@GetTenantId() tenantId: string) {
    return this.membershipsService.findAll(tenantId);
  }

  @Get(':id')
  async findById(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.membershipsService.findById(tenantId, id);
  }

  @Post()
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
