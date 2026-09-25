import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { TenantSettingsService } from './tenant-settings.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import { UpdateTenantWorkingHoursDto } from './dto/update-tenant-working-hours.dto';
import {
  TenantSettingsResponse,
  UpdateTenantGeneralSettingsResponse,
  UpdateTenantAppointmentSettingsResponse,
} from './types/tenant-settings.types';

@Controller('settings')
export class TenantSettingsController {
  constructor(private readonly tenantSettingsService: TenantSettingsService) {}

  @Permissions(PERMISSIONS.TENANT_READ)
  @Get()
  async getSettings(@GetTenantId() tenantId: string): Promise<TenantSettingsResponse> {
    return this.tenantSettingsService.getSettings(tenantId);
  }

  @Permissions(PERMISSIONS.TENANT_UPDATE)
  @Patch('general')
  async updateGeneralSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateGeneralSettingsDto,
  ): Promise<UpdateTenantGeneralSettingsResponse> {
    return this.tenantSettingsService.updateGeneralSettings(tenantId, updateDto);
  }

  @Permissions(PERMISSIONS.TENANT_UPDATE)
  @Patch('appointments')
  
  @Permissions(PERMISSIONS.TENANT_UPDATE)
  @Patch('working-hours')
  async updateWorkingHours(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateTenantWorkingHoursDto,
  ) {
    return this.tenantSettingsService.updateWorkingHours(tenantId, updateDto);
  }

  async updateAppointmentSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateAppointmentSettingsDto,
  ): Promise<UpdateTenantAppointmentSettingsResponse> {
    return this.tenantSettingsService.updateAppointmentSettings(tenantId, updateDto);
  }
}
