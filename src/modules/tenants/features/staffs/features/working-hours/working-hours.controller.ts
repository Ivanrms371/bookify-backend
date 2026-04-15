import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { WorkingHoursService } from './working-hours.service';
import { TenantStaffParamsDto, TenantStaffWorkingHoursParamsDto } from './dto/working-hours.params.dto';

@Controller('tenants/:tenantId/staff/:staffId/working-hours')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}
  @Get()
  findAllByStaffId(@Param() params: TenantStaffParamsDto) {
    return this.workingHoursService.findAllWorkingHoursByStaff(params);
  }

  @Post()
  createWorkingHour(@Param() params: TenantStaffParamsDto, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.createWorkingHour(params, body);
  }

  @Put(':workingHourId')
  updateWorkingHour(@Param() params: TenantStaffWorkingHoursParamsDto, @Body() body: UpdateWorkingHourDto) {
    return this.workingHoursService.updateWorkingHour(params, body);
  }

  @Delete(':workingHourId')
  deleteWorkingHour(@Param() params: TenantStaffWorkingHoursParamsDto) {
    return this.workingHoursService.deleteWorkingHour(params);
  }
}
