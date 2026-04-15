import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { TenantStaffParamsDto, TenantStaffExceptionsParamsDto } from './dto/schedule-exceptions.params.dto';

@Controller('tenants/:tenantId/staff/:staffId/schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private readonly scheduleExceptionsService: ScheduleExceptionsService) {}

  @Get()
  findAllByStaffId(@Param() params: TenantStaffParamsDto) {
    return this.scheduleExceptionsService.findAllByStaffId(params);
  }

  @Post()
  createScheduleException(@Param() params: TenantStaffParamsDto, @Body() body: CreateScheduleExceptionDto) {
    return this.scheduleExceptionsService.createScheduleException(params, body);
  }

  @Put(':exceptionId')
  updateScheduleException(@Param() params: TenantStaffExceptionsParamsDto, @Body() body: UpdateScheduleExceptionDto) {
    return this.scheduleExceptionsService.updateScheduleException(params, body);
  }

  @Delete(':exceptionId')
  deleteScheduleException(@Param() params: TenantStaffExceptionsParamsDto) {
    return this.scheduleExceptionsService.deleteScheduleException(params);
  }
}
