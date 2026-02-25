import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('staffs/:staffId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}
  @Get()
  async getAvailableSlots(@Param('staffId') staffId: string, @Query('date') date: string, @Query('service') serviceId: string) {
    return await this.availabilityService.getSlotsAvailability(staffId, serviceId, new Date());
  }
}
