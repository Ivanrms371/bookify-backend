import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';
import { AvailabilityService } from '../availability/availability.service';
import { GetAvailabilityOverviewDto } from './dto/get-availability-overview.dto';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  /**
   * Return a Tenant data with their services and professionals
   */
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
    return this.availabilityService.getAvailableSlotsByDay(dto);
  }

  @Get('availability/overview')
  async getProfessionalAvailabilityOverview(@Query() dto: GetAvailabilityOverviewDto) {
    return this.availabilityService.getAvailableOverview(dto);
  }

  @Post('booking')
  async createBooking(@Body() dto: CreatePublicBookingDto) {}
}
