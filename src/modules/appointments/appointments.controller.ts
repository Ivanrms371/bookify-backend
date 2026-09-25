import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';
import { AppointmentsService } from './appointments.service';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('')
  async findAll(@GetTenantId() tenantId: string, @Query() params: FindAllAppointmentsParamsDto) {
    return this.appointmentsService.findAll(tenantId, params);
  }

  @Get(':id')
  async findById(@GetTenantId() tenantId: string) {}

  @Post('')
  async create(@GetTenantId() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(tenantId, dto);
  }
}
