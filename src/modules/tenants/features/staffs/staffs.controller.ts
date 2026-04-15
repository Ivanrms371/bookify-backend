import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, Post, Body } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { StaffQueryParamsDto } from './dto/staff-query.params.dto';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants/:tenantId/staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get('')
  async findAllByTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Query() params: StaffQueryParamsDto) {
    return this.staffsService.findAllByTenant(tenantId, params);
  }

  @Post('invitations/bulk')
  async inviteBulk(@Param('tenantId', ParseUUIDPipe) tenantId: string, @Body() body: any) {
    return this.staffsService.bulkInvite(tenantId, body);
  }
}
