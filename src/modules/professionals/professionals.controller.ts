import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Controller, Get, Query, Req, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
import { CurrentTenant } from 'src/common/security/decorators/current-tenant.decorator';
import type { AuthenticatedUser, TenantContext } from 'src/common/security/types/authenticated-request.type';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { UpdateProfessionalStatusDto } from './dto/update-professional-status.dto';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Permissions(PERMISSIONS.PROFESSIONAL_READ)
  @Get()
  async findAll(@GetTenantId() tenantId: string, @Query() query: GetProfessionalsQueryDto) {
    return this.professionalsService.findAll(tenantId, query);
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_READ)
  @Get(':id')
  async findById(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.professionalsService.findById(tenantId, id);
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_READ)
  @Get(':id/details')
  async getDetails(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.professionalsService.getByIdWithDetails(tenantId, id, { id: user.id, role: tenant.role });
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)
  @Put('me/profile')
  async updateMyProfessionalProfile(
    @GetTenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.professionalsService.updateProfileByUser(tenantId, userId, dto);
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)
  @Post('me/services/:serviceId')
  async addMyService(@GetTenantId() tenantId: string, @CurrentUser('id') userId: string, @Param('serviceId') serviceId: string) {
    const prof = await this.professionalsService.findByUserId(tenantId, userId);
    return this.professionalsService.addService({ professionalId: prof.id, serviceId, tenantId });
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)
  @Delete('me/services/:serviceId')
  async deleteMyService(@GetTenantId() tenantId: string, @CurrentUser('id') userId: string, @Param('serviceId') serviceId: string) {
    const prof = await this.professionalsService.findByUserId(tenantId, userId);
    return this.professionalsService.removeService({ professionalId: prof.id, serviceId, tenantId });
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)
  @Patch(':id/status')
  async updateStatus(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProfessionalStatusDto) {
    return this.professionalsService.updateStatus(tenantId, id, dto.isActive);
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)
  @Put(':id')
  async update(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionalsService.update(tenantId, id, dto);
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)
  @Post(':id/services/:serviceId')
  async addService(@GetTenantId() tenantId: string, @Param('id') id: string, @Param('serviceId') serviceId: string) {
    return this.professionalsService.addService({ professionalId: id, serviceId, tenantId });
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)
  @Delete(':id/services/:serviceId')
  async deleteService(@GetTenantId() tenantId: string, @Param('id') id: string, @Param('serviceId') serviceId: string) {
    return this.professionalsService.removeService({ professionalId: id, serviceId, tenantId });
  }
}
