import { Controller, Put, Body, Param } from '@nestjs/common';
import { ProfessionalWorkingHoursService } from './working-hours.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { ProfessionalsService } from '../../professionals.service';
import { CreateWorkingHoursBulkDto } from './dto/create-working-hour.dto';

@Controller('professionals')
export class WorkingHoursController {
  constructor(
    private readonly workingHoursService: ProfessionalWorkingHoursService,
    private readonly professionalsService: ProfessionalsService,
  ) {}

  @Permissions(PERMISSIONS.SCHEDULE_UPDATE_SELF)
  @Put('me/working-hours')
  async updateMyWorkingHours(@GetTenantId() tenantId: string, @CurrentUser('id') userId: string, @Body() dto: CreateWorkingHoursBulkDto) {
    const prof = await this.professionalsService.findByUserId(tenantId, userId);
    return this.workingHoursService.replaceAll(tenantId, prof.id, dto);
  }

  @Permissions(PERMISSIONS.SCHEDULE_UPDATE)
  @Put(':id/working-hours')
  async updateWorkingHours(@GetTenantId() tenantId: string, @Param('id') id: string, @Body() dto: CreateWorkingHoursBulkDto) {
    return this.workingHoursService.replaceAll(tenantId, id, dto);
  }
}
