import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, Post, Body } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { EmployeeQueryParamsDto } from './dto/employee-query.params.dto';

@UseGuards(TenantGuard)
@Controller('tenants/:tenantId/staffs')
export class EmployeesController {
  constructor(private readonly staffsService: EmployeesService) {}

  @Get('')
  async findAllByTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() params: EmployeeQueryParamsDto) {
    return this.staffsService.findAllByTenant(tenantId, params);
  }

  @Post('invitations/bulk')
  async inviteBulk(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: any) {
    return this.staffsService.bulkInvite(tenantId, body);
  }
}
