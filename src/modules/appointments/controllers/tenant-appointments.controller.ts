import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { MembershipRoles } from 'src/common/decorators/tenant-roles.decorator';
import { MembershipRole } from 'src/generated/prisma/enums';
import { TenantAppointmentsService } from '../application/services/tenant-appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { EmployeeAppointmentUseCase } from '../application/usecases/employee-appointment.usecase';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { GetAppointmentsQueryDto } from '../dto/appointment-query.dto';

@UseGuards(TenantGuard)
@MembershipRoles(MembershipRole.OWNER)
@Controller('/tenants/:tenantId/appointments')
export class TenantAppointmentsController {
  constructor(
    private readonly employeeAppointmentUseCase: EmployeeAppointmentUseCase,
    private readonly tenantAppointmentsService: TenantAppointmentsService,
  ) {}

  @Post('')
  async createAppointment(@Body() body: CreateAppointmentDto) {
    try {
      await this.employeeAppointmentUseCase.execute(body);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('')
  async getAllByTenant(@Param('tenantId', new ParseUUIDPipe()) tenantId: string, @Query() params: GetAppointmentsQueryDto) {
    return this.tenantAppointmentsService.findAllByTenant(tenantId, params);
  }

  @Get(':appointmentId')
  async getAppointmentById(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
  ) {
    return this.tenantAppointmentsService.findByIdForTenant(tenantId, appointmentId);
  }

  @Patch(':appointmentId/no-show')
  async markAsNoShow(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
  ) {
    return this.tenantAppointmentsService.markAsNoShow(tenantId, appointmentId);
  }

  @Patch(':appointmentId/cancel')
  async markAsCancelled(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @Body() body: CancelAppointmentDto,
  ) {
    return this.tenantAppointmentsService.markAsCancelled(tenantId, appointmentId, body);
  }

  @Patch(':appointmentId/reschedule')
  async reschedule(
    @Param('tenantId', new ParseUUIDPipe()) tenantId: string,
    @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
    @Body() body: RescheduleAppointmentDto,
  ) {
    return this.tenantAppointmentsService.reschedule(tenantId, appointmentId, body);
  }
}
