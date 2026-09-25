import { Controller, Get, Param, Post, Body, Put, Patch, Delete, Req, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthenticatedRequest } from 'src/common/security/types/authenticated-request.type';
import { ParseUUIDv7Pipe } from 'src/common/pipes/validate-uuidv7.pipe';
import { GetServicesQueryDto } from './dto/get-services-query.dto';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@GetTenantId() tenantId: string, @Query() query: GetServicesQueryDto) {
    return this.servicesService.findAll(tenantId, query);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDv7Pipe) id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.findById(tenantId, id);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  create(@GetTenantId() tenantId: string, @Body() data: CreateServiceDto) {
    return this.servicesService.create(tenantId, data);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.toggleStatus(tenantId, id);
  }

  @Put(':id')
  update(@Param('id') id: string, @GetTenantId() tenantId: string, @Body() data: UpdateServiceDto) {
    return this.servicesService.update(tenantId, id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.delete(tenantId, id);
  }

  @Get('/:id/professionals')
  async getAllProfessionals(@Param('id', ParseUUIDv7Pipe) id: string, @GetTenantId() tenantId: string) {
    return this.servicesService.findAllProfessionals(tenantId, id);
  }
}
