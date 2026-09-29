import { Controller, Get, Query } from '@nestjs/common';
import { GetTenantId } from 'src/common/security/decorators/current-tenant.decorator';
import { AvailabilityService } from './availability.service';
import { GetDayAvailabilityQueryDto } from './dto/get-day-availability-query.dto';
import { GetAvailabilityOverviewQueryDto } from './dto/get-availability-overview-query.dto';
import { ValidateSlotQueryDto } from './dto/validate-slot-query.dto';
import {
  AppointmentAvailabilityResponse,
  AvailabilityOverviewResponse,
  DayAvailabilityResponse,
  ValidateSlotResponse,
} from './types/availability.types';
import { GetAppointmentAvailabilityQueryDto } from './dto/get-appointment-availability-query.dto';
import { Permissions } from 'src/common/security/decorators/permissions.decorator';
import { PERMISSIONS } from 'src/common/security/constants/permissions.constant';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * Returns available time slots for a specific day.
   * If no slots are available, it searches forward to find the next available day.
   *
   * GET /availability/slots?professionalId=...&serviceId=...&date=YYYY-MM-DD
   */
  @Get('slots')
  async getSlotsByDay(@Query() query: GetDayAvailabilityQueryDto): Promise<DayAvailabilityResponse> {
    return this.availabilityService.getAvailableSlotsByDay(query);
  }

  /**
   * Returns appointment slots for staff booking across a date range.
   * Includes available, busy and past statuses and resolves tenant from auth context.
   *
   * GET /availability/appointments?professionalId=...&serviceId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  @Get('appointments')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  async getAppointmentAvailability(
    @GetTenantId() tenantId: string,
    @Query() query: GetAppointmentAvailabilityQueryDto,
  ): Promise<AppointmentAvailabilityResponse> {
    return this.availabilityService.getAppointmentAvailability({
      tenantId,
      ...query,
    });
  }

  /**
   * Returns an overview of availability for a date range.
   * Each day is categorized as AVAILABLE, SATURATED, EMPTY, or CLOSED.
   *
   * GET /availability/overview?professionalId=...&serviceId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  @Get('overview')
  async getOverview(@Query() query: GetAvailabilityOverviewQueryDto): Promise<AvailabilityOverviewResponse> {
    return this.availabilityService.getAvailableOverview(query);
  }

  /**
   * Validates whether a specific time slot is available for booking.
   *
   * GET /availability/validate?professionalId=...&serviceId=...&startTime=ISO8601
   */
  @Get('validate')
  async validateSlot(@Query() query: ValidateSlotQueryDto): Promise<ValidateSlotResponse> {
    const available = await this.availabilityService.isSlotAvailable(query);
    return { available };
  }
}
