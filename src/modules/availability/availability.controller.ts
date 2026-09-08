import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetTenantId } from 'src/common/decorators/get-tenant-id.decorator';
import { AvailabilityService } from './availability.service';
import { GetDayAvailabilityQueryDto } from './dto/get-day-availability-query.dto';
import { GetAvailabilityOverviewQueryDto } from './dto/get-availability-overview-query.dto';
import { ValidateSlotQueryDto } from './dto/validate-slot-query.dto';
import { AvailabilityOverviewResponse, DayAvailabilityResponse } from './types/availability.types';

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
  async getSlotsByDay(@GetTenantId() tenantId: string, @Query() query: GetDayAvailabilityQueryDto): Promise<DayAvailabilityResponse> {
    return this.availabilityService.getAvailableSlotsByDay({
      tenantId,
      professionalId: query.professionalId,
      serviceId: query.serviceId,
      date: query.date,
    });
  }

  /**
   * Returns an overview of availability for a date range.
   * Each day is categorized as AVAILABLE, SATURATED, EMPTY, or CLOSED.
   *
   * GET /availability/overview?professionalId=...&serviceId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  @Get('overview')
  async getOverview(
    @GetTenantId() tenantId: string,
    @Query() query: GetAvailabilityOverviewQueryDto,
  ): Promise<AvailabilityOverviewResponse> {
    return this.availabilityService.getAvailableOverview({
      tenantId,
      professionalId: query.professionalId,
      serviceId: query.serviceId,
      startDate: query.startDate,
      endDate: query.endDate,
      saturationThreshold: query.saturationThreshold,
    });
  }

  /**
   * Validates whether a specific time slot is available for booking.
   *
   * GET /availability/validate?professionalId=...&serviceId=...&startTime=ISO8601
   */
  @Get('validate')
  async validateSlot(@Query() query: ValidateSlotQueryDto): Promise<{ available: boolean }> {
    const available = await this.availabilityService.isSlotAvailable({
      tenantId: query.tenantId,
      professionalId: query.professionalId,
      serviceId: query.serviceId,
      startTime: query.startTime,
      ignoreMinAdvanced: false,
    });

    return { available };
  }
}
