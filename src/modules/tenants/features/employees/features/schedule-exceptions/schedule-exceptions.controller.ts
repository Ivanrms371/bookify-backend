import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { TenantEmployeeParamsDto, TenantEmployeeExceptionsParamsDto } from './dto/schedule-exceptions.params.dto';

@Controller('tenants/:tenantId/staff/:employeeId/schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private readonly scheduleExceptionsService: ScheduleExceptionsService) {}

  @Get()
  findAllByEmployeeId(@Param() params: TenantEmployeeParamsDto) {
    return this.scheduleExceptionsService.findAllByEmployeeId(params);
  }

  @Post()
  createScheduleException(@Param() params: TenantEmployeeParamsDto, @Body() body: CreateScheduleExceptionDto) {
    return this.scheduleExceptionsService.createScheduleException(params, body);
  }

  @Put(':exceptionId')
  updateScheduleException(@Param() params: TenantEmployeeExceptionsParamsDto, @Body() body: UpdateScheduleExceptionDto) {
    return this.scheduleExceptionsService.updateScheduleException(params, body);
  }

  @Delete(':exceptionId')
  deleteScheduleException(@Param() params: TenantEmployeeExceptionsParamsDto) {
    return this.scheduleExceptionsService.deleteScheduleException(params);
  }
}
