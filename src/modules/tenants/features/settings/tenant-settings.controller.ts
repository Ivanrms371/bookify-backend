import { Controller, Get, Patch, Body } from '@nestjs/common';
import { TenantSettingsService } from './tenant-settings.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import {
  TenantSettingsResponse,
  UpdateTenantGeneralSettingsResponse,
  UpdateTenantAppointmentSettingsResponse,
} from './types/tenant-settings.types';

@Controller('settings')
export class TenantSettingsController {
  constructor(private readonly tenantSettingsService: TenantSettingsService) {}

  @Get()
  async getSettings(@GetTenantId() tenantId: string): Promise<TenantSettingsResponse> {
    return this.tenantSettingsService.getSettings(tenantId);
  }

  @Patch('general')
  async updateGeneralSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateGeneralSettingsDto,
  ): Promise<UpdateTenantGeneralSettingsResponse> {
    return this.tenantSettingsService.updateGeneralSettings(tenantId, updateDto);
  }

  @Patch('appointments')
  async updateAppointmentSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateAppointmentSettingsDto,
  ): Promise<UpdateTenantAppointmentSettingsResponse> {
    return this.tenantSettingsService.updateAppointmentSettings(tenantId, updateDto);
  }
}
