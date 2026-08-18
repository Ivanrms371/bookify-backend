import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@GetTenantId() tenantId: string) {
    return this.settingsService.getSettings(tenantId);
  }

  @Patch('general')
  async updateGeneralSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateGeneralSettingsDto,
  ) {
    return this.settingsService.updateGeneralSettings(tenantId, updateDto);
  }

  @Patch('appointments')
  async updateAppointmentSettings(
    @GetTenantId() tenantId: string,
    @Body() updateDto: UpdateAppointmentSettingsDto,
  ) {
    return this.settingsService.updateAppointmentSettings(tenantId, updateDto);
  }
}
