import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { BusinessStaffParamsDto, BusinessStaffWorkingHoursParamsDto } from '../../dto/params.dto';
import { WorkingHoursService } from './working-hours.service';

@Controller('businesses/:businessId/staff/:staffId/working-hours')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}
  @Get()
  findAllByStaffId(@Param() params: BusinessStaffParamsDto) {
    return this.workingHoursService.findAllWorkingHoursByStaff(params);
  }

  @Post()
  createWorkingHour(@Param() params: BusinessStaffParamsDto, @Body() body: CreateWorkingHourDto) {
    return this.workingHoursService.createWorkingHour(params, body);
  }

  @Put(':workingHourId')
  updateWorkingHour(
    @Param() params: BusinessStaffWorkingHoursParamsDto,
    @Body() body: UpdateWorkingHourDto,
  ) {
    return this.workingHoursService.updateWorkingHour(params, body);
  }

  @Delete(':workingHourId')
  deleteWorkingHour(@Param() params: BusinessStaffWorkingHoursParamsDto) {
    return this.workingHoursService.deleteWorkingHour(params);
  }
}
