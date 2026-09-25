import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';
import { GetAvailabilityOverviewDto } from './dto/get-availability-overview.dto';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import { ValidateSlotAvailabilityDto } from './dto/validate-slot.dto';
import { ReschedulePublicAppointmentDto } from './dto/reschedule-public-appointment.dto';
import { CancelPublicAppointmentDto } from './dto/cancel-public-appointment.dto';
import { Public } from 'src/common/security/decorators/public.decorator';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('tenants/:slug')
  async getTenantBySlug(@Param('slug') slug: string) {
    return this.publicService.getTenantBySlug(slug);
  }

  @Get('tenants/:id/services')
  async getServices(@Param('id') id: string) {
    return this.publicService.getServices(id);
  }

  @Get('professionals/:id/services')
  async getServicesByProfessional(@Param('id') id: string) {
    return this.publicService.getServicesByProfessional(id);
  }

  @Get('tenants/:id/professionals')
  async getProfessionals(@Param('id') id: string) {
    return this.publicService.getProfessionals(id);
  }

  @Get('services/:id/professionals')
  async getProfessionalsByService(@Param('id') id: string) {
    return this.publicService.getProfessionalsByService(id);
  }

  @Get('availability/slots')
  async getProfessionalAvailabilitySlots(@Query() dto: GetSlotsQueryDto) {
    return this.publicService.getProfessionalAvailabilitySlots(dto);
  }

  @Get('availability/overview')
  async getProfessionalAvailabilityOverview(@Query() dto: GetAvailabilityOverviewDto) {
    return this.publicService.getProfessionalAvailabilityOverview(dto);
  }

  @Get('availability/validate')
  async checkSlotAvailability(@Query() dto: ValidateSlotAvailabilityDto) {
    return this.publicService.checkSlotAvailability(dto);
  }

  @Get('appointment/:token')
  async getAppointment(@Param('token') token: string) {
    return this.publicService.getAppointmentByToken(token);
  }

  @Post('appointment')
  async createAppointment(@Body() dto: CreatePublicAppointmentDto) {
    return this.publicService.createAppointment(dto);
  }

  @Put('appointment/:token')
  async rescheduleAppointment(@Param('token') token: string, @Body() dto: ReschedulePublicAppointmentDto) {
    return this.publicService.rescheduleAppointment(token, dto);
  }

  @Delete('appointment/:token')
  async cancelAppointment(@Param('token') token: string, @Body() dto: CancelPublicAppointmentDto) {
    return this.publicService.cancelAppointment(token, dto);
  }
}
