import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { TenantProfessionalParamsDto, TenantProfessionalExceptionsParamsDto } from './dto/schedule-exceptions.params.dto';

@Controller('professionals/:professionalId/schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private readonly scheduleExceptionsService: ScheduleExceptionsService) {}

  @Get()
  findAll(@Param() params: TenantProfessionalParamsDto) {
    return this.scheduleExceptionsService.findAll(params);
  }

  @Post()
  create(@Param() params: TenantProfessionalParamsDto, @Body() body: CreateScheduleExceptionDto) {
    return this.scheduleExceptionsService.create(params, body);
  }

  @Put(':id')
  update(@Param() params: TenantProfessionalExceptionsParamsDto, @Body() body: UpdateScheduleExceptionDto) {
    return this.scheduleExceptionsService.update(params, body);
  }

  @Delete(':id')
  delete(@Param() params: TenantProfessionalExceptionsParamsDto) {
    return this.scheduleExceptionsService.delete(params);
  }
}
