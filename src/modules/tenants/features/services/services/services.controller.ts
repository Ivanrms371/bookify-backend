import { Controller, Get, Param, Post, Body, Put, Patch, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServicesBulkDto } from './dto/create-services-bulk.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { Req } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/auth/types/express-request.type';
import { UseGuards } from '@nestjs/common';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { ParseUUIDv7Pipe } from 'src/common/pipes/validate-uuidv7.pipe';
import { TenantGuard } from 'src/common/guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller('tenants/:tenantId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  listByTenant(@Param('tenantId') tenantId: string) {
    return this.servicesService.findAllServicesByTenant(tenantId);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDv7Pipe) id: string, @Param('tenantId') tenantId: string) {
    return this.servicesService.findServiceById(id, tenantId);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Patch('reorder')
  reorder(@Param('tenantId') tenantId: string, @Body() orders: ReorderServiceDto[]) {
    return this.servicesService.reorderServices(tenantId, orders);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  create(@Param('tenantId') tenantId: string, @Body() data: CreateServiceDto, @UploadedFiles() files: { image?: Express.Multer.File[] }) {
    return this.servicesService.createService(tenantId, data, files);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Param('tenantId') tenantId: string, @Body() data: UpdateServiceDto) {
    return this.servicesService.updateService(id, tenantId, data);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Patch(':id/activate')
  activate(@Param('id') id: string, @Param('tenantId') tenantId: string) {
    return this.servicesService.activateService(id, tenantId);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Param('tenantId') tenantId: string) {
    return this.servicesService.deactivateService(id, tenantId);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Delete(':id')
  softDelete(@Param('id') id: string, @Param('tenantId') tenantId: string) {
    return this.servicesService.softDeleteService(id, tenantId);
  }

  @Post(':id/assignments/toggle-me')
  toggleSelfAssignment(@Param('id') id: string, @Param('tenantId') tenantId: string, @Req() req: AuthenticatedRequest) {
    return this.servicesService.toggleSelfAssignment(id, tenantId, req.user.userId);
  }

  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  @Put(':id/assignments')
  updateAssignments(@Param('id') id: string, @Param('tenantId') tenantId: string, @Body() body: { employeeIds: string[] }) {
    return this.servicesService.updateAssignments(id, tenantId, body.employeeIds);
  }
}
