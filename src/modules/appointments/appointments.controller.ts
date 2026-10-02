import { Body, Controller, Get, Post, Delete, Param, Patch, Query } from '@nestjs/common';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';
import { AppointmentsService } from './appointments.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { CurrentUser } from 'src/common/security/decorators/current-user.decorator';
import { AuthenticatedUser, TenantContext } from 'src/common/security/types/authenticated-request.type';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CurrentTenant } from 'src/common/security/decorators/current-tenant.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  async findAll(@GetTenantId() tenantId: string, @Query() params: FindAllAppointmentsParamsDto) {
    return this.appointmentsService.findAll(tenantId, params);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  async findById(@GetTenantId() tenantId: string) {}

  @Post('')
  @Permissions(PERMISSIONS.APPOINTMENT_CREATE)
  async create(@GetTenantId() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenantId, dto);
  }

  @Patch(':id/reschedule')
  @Permissions(PERMISSIONS.APPOINTMENT_RESCHEDULE)
  async reschedule(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @CurrentTenant() tenantContext: TenantContext,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(tenantId, id, currentUser, tenantContext.permissions, dto);
  }

  @Patch(':id/cancel')
  @Permissions(PERMISSIONS.APPOINTMENT_CANCEL)
  async cancel(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @CurrentTenant() tenantContext: TenantContext,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(tenantId, id, currentUser, tenantContext.permissions, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.APPOINTMENT_DELETE)
  async delete(@GetTenantId() tenantId: string, @Param('id') id: string) {
    // return this.appointmentsService.delete(tenantId, id);
    return { success: true };
  }
}
