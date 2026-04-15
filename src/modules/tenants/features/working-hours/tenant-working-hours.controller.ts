import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { TenantWorkingHoursService } from './tenant-working-hours.service';
import { UpdateWorkingHourDto, UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/working-hours')
export class TenantWorkingHoursController {
  constructor(private readonly workingHoursService: TenantWorkingHoursService) {}

  @Get()
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.STAFF)
  findAll(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.workingHoursService.findAllByTenant(tenantId);
  }

  @Post()
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  create(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.create(tenantId, body);
  }

  @Post('bulk')
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  bulkUpdate(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: UpdateWorkingHoursBulkDto) {
    return this.workingHoursService.bulkUpdate(tenantId, body);
  }

  @Put(':workingHourId')
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('workingHourId', ParseUUIDPipe) workingHourId: string,
    @Body() body: UpdateWorkingHourDto,
  ) {
    return this.workingHoursService.update(tenantId, workingHourId, body);
  }

  @Delete(':workingHourId')
  @MembershipRoles(MembershipRole.OWNER, MembershipRole.ADMIN)
  delete(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Param('workingHourId', ParseUUIDPipe) workingHourId: string) {
    return this.workingHoursService.delete(tenantId, workingHourId);
  }
}
