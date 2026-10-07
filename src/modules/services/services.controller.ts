import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Controller, Get, Param, Post, Body, Put, Patch, Delete, Req, UseInterceptors, UploadedFiles, Query, ParseUUIDPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { GetServicesQueryDto } from './dto/get-services-query.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Permissions(PERMISSIONS.SERVICE_READ)
  @Get()
  findAll(@GetTenantId() tenantId: string, @Query() query: GetServicesQueryDto) {
    return this.servicesService.findAll(tenantId, query);
  }

  @Permissions(PERMISSIONS.SERVICE_READ)
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.findById(tenantId, id);
  }

  @Permissions(PERMISSIONS.SERVICE_CREATE)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  create(@GetTenantId() tenantId: string, @Body() data: CreateServiceDto) {
    return this.servicesService.create(tenantId, data);
  }

  @Permissions(PERMISSIONS.SERVICE_UPDATE)
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.toggleStatus(tenantId, id);
  }

  @Permissions(PERMISSIONS.SERVICE_UPDATE)
  @Put(':id')
  update(@Param('id') id: string, @GetTenantId() tenantId: string, @Body() data: UpdateServiceDto) {
    return this.servicesService.update(tenantId, id, data);
  }

  @Permissions(PERMISSIONS.SERVICE_DELETE)
  @Delete(':id')
  delete(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.delete(tenantId, id);
  }

  @Permissions(PERMISSIONS.SERVICE_READ)
  @Get('/:id/professionals')
  async getAllProfessionals(@Param('id', ParseUUIDPipe) id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.findAllProfessionals(tenantId, id);
  }
}
