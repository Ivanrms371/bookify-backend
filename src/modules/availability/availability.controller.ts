import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { getDay } from 'date-fns';

@Controller('staffs/:staffId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}
  @Get()
  async getAvailableSlots(@Param('staffId') staffId: string, @Query('date') date: string, @Query('service') serviceId: string) {
    const dateFormatted = new Date(date);
    console.log(getDay(dateFormatted)); // day
    return await this.availabilityService.getSlotsAvailability(staffId, serviceId, dateFormatted);
  }
}
