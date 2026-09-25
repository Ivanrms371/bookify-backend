import { Injectable, NotFoundException } from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { ServicesService } from '../services/services.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { TenantsService } from '../tenants/tenants.service';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';
import { GetAvailabilityOverviewDto } from './dto/get-availability-overview.dto';
import { ValidateSlotAvailabilityDto } from './dto/validate-slot.dto';

import { AppointmentsPublicService } from '../appointments/appointments-public.service';
import { CancelPublicParams, CreatePublicParams, ReschedulePublicParams } from '../appointments/appointments.types';

@Injectable()
export class PublicService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly servicesService: ServicesService,
    private readonly professionalsService: ProfessionalsService,
    private readonly availabilityService: AvailabilityService,
    private readonly appointmentsPublicService: AppointmentsPublicService,
  ) {}

  async getTenantBySlug(slug: string) {
    const tenant = await this.tenantsService.findPublicBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }
    return tenant;
  }

  async getServices(tenantId: string) {
    return this.servicesService.findAllPublic(tenantId);
  }

  async getServicesByProfessional(professionalId: string) {
    return this.servicesService.findAllPublicByProfessional(professionalId);
  }

  async getProfessionals(tenantId: string) {
    return this.professionalsService.findAllPublic(tenantId);
  }

  async getProfessionalsByService(serviceId: string) {
    return this.professionalsService.findAllPublicByService(serviceId);
  }

  async getProfessionalAvailabilitySlots(dto: GetSlotsQueryDto) {
    return this.availabilityService.getAvailableSlotsByDay(dto);
  }

  async getProfessionalAvailabilityOverview(dto: GetAvailabilityOverviewDto) {
    return this.availabilityService.getAvailableOverview(dto);
  }

  async checkSlotAvailability(dto: ValidateSlotAvailabilityDto) {
    const available = await this.availabilityService.isSlotAvailable(dto);
    return { available };
  }

  async getAppointmentByToken(token: string) {
    return this.appointmentsPublicService.findByToken(token);
  }

  async createAppointment(dto: CreatePublicParams) {
    return this.appointmentsPublicService.create(dto);
  }

  async rescheduleAppointment(token: string, params: ReschedulePublicParams) {
    return this.appointmentsPublicService.reschedule(token, params);
  }

  async cancelAppointment(token: string, params: CancelPublicParams) {
    return this.appointmentsPublicService.cancel(token, params);
  }
}
