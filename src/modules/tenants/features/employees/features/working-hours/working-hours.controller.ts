import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { WorkingHoursService } from './working-hours.service';
import { TenantEmployeeParamsDto, TenantEmployeeWorkingHoursParamsDto } from './dto/working-hours.params.dto';

@Controller('tenants/:tenantId/staff/:employeeId/working-hours')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}
  @Get()
  findAllByEmployeeId(@Param() params: TenantEmployeeParamsDto) {
    return this.workingHoursService.findAllWorkingHoursByEmployee(params);
  }

  @Post()
  createWorkingHour(@Param() params: TenantEmployeeParamsDto, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.createWorkingHour(params, body);
  }

  @Put(':workingHourId')
  updateWorkingHour(@Param() params: TenantEmployeeWorkingHoursParamsDto, @Body() body: UpdateWorkingHourDto) {
    return this.workingHoursService.updateWorkingHour(params, body);
  }

  @Delete(':workingHourId')
  deleteWorkingHour(@Param() params: TenantEmployeeWorkingHoursParamsDto) {
    return this.workingHoursService.deleteWorkingHour(params);
  }
}
