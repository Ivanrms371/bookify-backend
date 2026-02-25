import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { BusinessStaffParamsDto, BusinessStaffExceptionsParamsDto } from '../../dto/params.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';

@Controller('businesses/:businessId/staff/:staffId/schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private readonly scheduleExceptionsService: ScheduleExceptionsService) {}

  @Get()
  findAllByStaffId(@Param() params: BusinessStaffParamsDto) {
    return this.scheduleExceptionsService.findAllByStaffId(params);
  }

  @Post()
  createScheduleException(
    @Param() params: BusinessStaffParamsDto,
    @Body() body: CreateScheduleExceptionDto,
  ) {
    return this.scheduleExceptionsService.createScheduleException(params, body);
  }

  @Put(':exceptionId')
  updateScheduleException(
    @Param() params: BusinessStaffExceptionsParamsDto,
    @Body() body: UpdateScheduleExceptionDto,
  ) {
    return this.scheduleExceptionsService.updateScheduleException(params, body);
  }

  @Delete(':exceptionId')
  deleteScheduleException(@Param() params: BusinessStaffExceptionsParamsDto) {
    return this.scheduleExceptionsService.deleteScheduleException(params);
  }
}
