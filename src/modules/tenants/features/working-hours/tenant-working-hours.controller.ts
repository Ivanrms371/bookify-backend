import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TenantWorkingHoursService } from './tenant-working-hours.service';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { CreateWorkingHoursBulkDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';

@UseGuards(TenantGuard)
@Controller('tenants/:tenantId/working-hours')
export class TenantWorkingHoursController {
  constructor(private readonly workingHoursService: TenantWorkingHoursService) {}

  @Get()
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.EMPLOYEE)
  findAll(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.workingHoursService.findAllByTenant(tenantId);
  }

  @Post()
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: CreateWorkingHoursBulkDto) {
    return this.workingHoursService.create(tenantId, body);
  }

  @Post('bulk')
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  bulkUpdate(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: UpdateWorkingHoursBulkDto) {
    return this.workingHoursService.bulkUpdate(tenantId, body);
  }

  @Delete(':workingHourId')
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('workingHourId', ParseUUIDPipe) workingHourId: string) {
    return this.workingHoursService.delete(tenantId, workingHourId);
  }
}
