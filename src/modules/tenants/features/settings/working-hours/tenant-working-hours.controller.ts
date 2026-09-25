import { Controller, Get, Put, Body } from '@nestjs/common';
import { TenantWorkingHoursService } from './tenant-working-hours.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { UpdateTenantWorkingHoursDto } from '../dto/update-tenant-working-hours.dto';

@Controller('settings/working-hours')
export class TenantWorkingHoursController {
  constructor(private readonly service: TenantWorkingHoursService) {}

  @Permissions(PERMISSIONS.TENANT_READ)
  @Get()
  async findAll(@GetTenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Permissions(PERMISSIONS.TENANT_UPDATE)
  @Put()
  async replace(@GetTenantId() tenantId: string, @Body() dto: UpdateTenantWorkingHoursDto) {
    return this.service.replace(tenantId, dto);
  }
}
