import { Controller, Get, Param, Post, Body, Put, Patch, Delete } from '@nestjs/common';
import { ServiceManagementService } from '../services/service-managment.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ReorderServiceDto } from '../dto/reoder-service.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('business/:businessId/services')
export class ServiceManagementController {
  constructor(private readonly serviceManagementService: ServiceManagementService) {}

  @Get()
  listByBusiness(@Param('businessId') businessId: string) {
    return this.serviceManagementService.findAllByBusiness(businessId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.serviceManagementService.findById(id);
  }

  @Patch('reorder')
  reorder(@Param('businessId') businessId: string, @Body() orders: ReorderServiceDto[]) {
    return this.serviceManagementService.reorder(businessId, orders);
  }

  @Post()
  create(@Param('businessId') businessId: string, @Body() data: CreateServiceDto) {
    return this.serviceManagementService.create(businessId, data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateServiceDto) {
    return this.serviceManagementService.update(id, data);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.serviceManagementService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.serviceManagementService.deactivate(id);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.serviceManagementService.softDelete(id);
  }
}
