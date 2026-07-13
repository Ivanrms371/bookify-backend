import { Controller, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('employees/:employeeId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  async getBaseConfig(@Param('employeeId') employeeId: string) {
    return this.availabilityService.getBaseConfig(employeeId);
  }

  @Public()
  @Get('slots')
  async getSlots(@Param('employeeId') employeeId: string, @Query('date') date?: string) {
    return this.availabilityService.getSlots(employeeId, date);
  }
}
