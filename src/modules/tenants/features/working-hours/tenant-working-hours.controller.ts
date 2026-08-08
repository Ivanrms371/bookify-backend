import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TenantWorkingHoursService } from './tenant-working-hours.service';
import { CreateWorkingHoursBulkDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantGuard } from 'src/auth/guards/tenant.guard';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/working-hours')
export class TenantWorkingHoursController {
  constructor(private readonly workingHoursService: TenantWorkingHoursService) {}

  @Get()
  findAll(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.workingHoursService.findAllByTenant(tenantId);
  }

  @Post()
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: CreateWorkingHoursBulkDto) {
    return this.workingHoursService.create(tenantId, body);
  }

  @Post('bulk')
  bulkUpdate(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: UpdateWorkingHoursBulkDto) {
    return this.workingHoursService.bulkUpdate(tenantId, body);
  }

  @Delete(':workingHourId')
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('workingHourId', ParseUUIDPipe) workingHourId: string) {
    return this.workingHoursService.delete(tenantId, workingHourId);
  }
}
