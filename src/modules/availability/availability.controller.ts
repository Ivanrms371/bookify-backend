import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('staffs/:staffId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  async getBaseConfig(@Param('staffId') staffId: string) {
    return this.availabilityService.getBaseConfig(staffId);
  }

  @Public()
  @Get('slots')
  async getSlots(@Param('staffId') staffId: string, @Query('date') date?: string) {
    return this.availabilityService.getSlots(staffId, date);
  }
}
